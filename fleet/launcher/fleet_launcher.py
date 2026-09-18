#!/usr/bin/env python3
"""
fleet_launcher.py — Lanceur non-interactif d'Hermes piloté par le bus Redis.

Garantit :
- réservation atomique d'une tâche via Redis (SET NX avec expiration) ;
- lancement de `hermes chat --query-file --oneshot -Q --format stream-json` ;
- capture de stdout/stderr, code de sortie, durée ;
- publication du résultat structuré dans Redis (résultat métier, pas juste code exit) ;
- aucun appel à tmux.

Usage :
    python3 fleet_launcher.py --agent <agent_id> --task-id <id> --query-file <path> \
        [--profile <hermes_profile>] [--provider <provider>] [--model <model>] \
        [--worktree] [--max-turns N] [--run-budget N] [--accept-hooks] \
        [--workspace-dir <dir>] [--session-id <hermes_session_id>]

Variables d'environnement supportées :
    REDIS_HOST, REDIS_PORT, REDIS_PASS
    HERMES_BIN    (défaut: /usr/local/bin/hermes)
    HERMES_PROFILE (défaut: default)
    HERMES_PROVIDER (défaut: nous)
    HERMES_MODEL   (défaut: meituan/longcat-2.0:free)
    AGENT_ENV_FILE (fichier .env additionnel pour l'agent)
    LOG_DIR        (défaut: /var/log/fleet)
"""

from __future__ import annotations

import argparse
import json
import os
import signal
import subprocess
import sys
import time
import traceback
from datetime import datetime, timezone
from pathlib import Path

# ── Import du protocole sibling ──────────────────────────────────────────────
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from protocol.fleet_protocol import (
    PROTOCOL_VERSION,
    BusinessState,
    TransportState,
    claim_key,
    make_result,
    msg_key,
    result_key,
    task_key,
)

# ── Configuration Redis par défaut ───────────────────────────────────────────
REDIS_HOST = os.environ.get("REDIS_HOST", "172.16.12.2")
REDIS_PORT = int(os.environ.get("REDIS_PORT", 6379))
REDIS_PASS = os.environ.get("REDIS_PASS", "")

HERMES_BIN = os.environ.get("HERMES_BIN", "/usr/local/bin/hermes")
LOG_DIR = Path(os.environ.get("LOG_DIR", "/var/log/fleet"))
CLAIM_TTL = int(os.environ.get("CLAIM_TTL", "300"))  # 5 min par défaut


def log(msg: str, *, agent: str = "", level: str = "INFO") -> None:
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    line = f"{ts} [{level}] launcher agent={agent} {msg}"
    print(line, flush=True)
    try:
        LOG_DIR.mkdir(parents=True, exist_ok=True)
        with (LOG_DIR / f"{agent}.log").open("a") as f:
            f.write(line + "\n")
    except Exception:
        pass


def get_redis():
    import redis  # import différé pour permettre --help sans redis-py
    pool = redis.ConnectionPool(
        host=REDIS_HOST, port=REDIS_PORT, password=REDIS_PASS or None,
        decode_responses=True, socket_connect_timeout=5, socket_timeout=10,
        retry_on_timeout=True,
    )
    return redis.Redis(connection_pool=pool)


# ── Claim / release de tâche ────────────────────────────────────────────────
class TaskClaim:
    """Réservation exclusive d'une tâche. TTL renouvelable via touch()."""

    def __init__(self, r, agent: str, task_id: str, ttl: int = CLAIM_TTL):
        self.r = r
        self.agent = agent
        self.task_id = task_id
        self.ttl = ttl
        self.claim_id = f"claim_{os.getpid()}_{int(time.time())}"
        self._key = claim_key(task_id)

    def acquire(self) -> bool:
        """SET NX — True si acquis, False si déjà possédé par quelqu'un d'autre."""
        acquired = self.r.set(
            self._key, self.claim_id, nx=True, ex=self.ttl
        )
        if acquired:
            log(f"CLAIM_ACQUIRED key={self._key} claim_id={self.claim_id}", agent=self.agent)
        else:
            existing = self.r.get(self._key)
            log(f"CLAIM_BUSY key={self._key} owner={existing}", agent=self.agent)
        return bool(acquired)

    def release(self) -> None:
        # Script Lua : supprimer seulement si on est toujours propriétaire
        script = """
        if redis.call("get", KEYS[1]) == ARGV[1] then
            return redis.call("del", KEYS[1])
        else
            return 0
        end
        """
        try:
            self.r.eval(script, 1, self._key, self.claim_id)
            log(f"CLAIM_RELEASED key={self._key}", agent=self.agent)
        except Exception as e:
            log(f"CLAIM_RELEASE_ERROR key={self._key} error={e}", agent=self.agent, level="WARN")

    def extend(self, extra_ttl: int | None = None) -> bool:
        """Renouvelle le claim si on en est toujours propriétaire. Retourne True si OK."""
        ttl = extra_ttl or self.ttl
        script = """
        if redis.call("get", KEYS[1]) == ARGV[1] then
            return redis.call("expire", KEYS[1], ARGV[2])
        else
            return 0
        end
        """
        try:
            ok = self.r.eval(script, 1, self._key, self.claim_id, str(ttl))
            return bool(ok)
        except Exception:
            return False

    @property
    def is_owner(self) -> bool:
        try:
            return self.r.get(self._key) == self.claim_id
        except Exception:
            return False


# ── Construction de la commande Hermes ───────────────────────────────────────
def build_hermes_cmd(args: argparse.Namespace) -> list[str]:
    """
    Construit la commande hermes en utilisant UNIQUEMENT les options CLI vérifiées.
    Aucun shell expansion, aucune interpolation de texte brut.
    """
    cmd = [HERMES_BIN, "chat"]

    # Entrée structurée depuis un fichier — zéro injection shell possible
    cmd += ["--query-file", args.query_file]

    # Mode non-interactif : répondre et quitter
    cmd += ["--oneshot", "-Q"]

    # Format de sortie structuré
    cmd += ["--format", "stream-json"]

    # Profil Hermes (isolation de config/skills/mémoire)
    if args.profile:
        cmd += ["--profile", args.profile]

    # Provider et modèle
    if args.provider:
        cmd += ["--provider", args.provider]
    if args.model:
        cmd += ["--model", args.model]

    # Worktree isolé si demandé
    if args.worktree:
        cmd += ["--worktree"]

    # Auto-accept hooks (pas de prompt interactif)
    if args.accept_hooks:
        cmd += ["--accept-hooks"]

    # Limite de tours tool-calling
    if args.max_turns:
        cmd += ["--max-turns", str(args.max_turns)]

    # Budget temps wall-clock
    if args.run_budget:
        cmd += ["--run-budget", str(args.run_budget)]

    # Reprise de session
    if args.session_id:
        cmd += ["--resume", args.session_id]

    # Pas de restauration cwd si workspace explicite
    if args.workspace_dir:
        cmd += ["--no-restore-cwd"]

    # Session source tag (filtrage)
    cmd += ["--source", "fleet"]

    return cmd


# ── Exécution de la tâche ───────────────────────────────────────────────────
def run_task(
    r,
    agent: str,
    task_id: str,
    cmd: list[str],
    *,
    workdir: str | None = None,
    env_file: str | None = None,
    claim: TaskClaim,
    msg_run_budget: int | None = None,
) -> dict:
    """Lance Hermes en sous-processus, capture le résultat, publie dans Redis."""

    start = time.monotonic()
    log(f"RUN_START task_id={task_id} cmd={' '.join(cmd[:6])}...", agent=agent)

    # Préparation de l'environnement
    env = os.environ.copy()
    if env_file and Path(env_file).exists():
        # Chargement sécurisé du .env (clé=valeur, pas de code)
        with open(env_file) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, _, v = line.partition("=")
                    env[k.strip()] = v.strip()
        log(f"ENV_LOADED file={env_file}", agent=agent)

    # Fichier de checkpoint (preuve d'exécution)
    checkpoint = LOG_DIR / f"{agent}_{task_id}_checkpoint.json"

    stdout_data: list[str] = []
    stderr_data: list[str] = []
    exit_code = -1
    status = BusinessState.FAILED
    error_msg = ""

    try:
        timeout = (msg_run_budget + 30) if msg_run_budget else 600
        proc = subprocess.run(
            cmd,
            cwd=workdir,
            env=env,
            capture_output=True,
            text=True,
            timeout=timeout,
        )
        exit_code = proc.returncode
        stdout_data = proc.stdout.splitlines()
        stderr_data = proc.stderr.splitlines()
        log(
            f"RUN_FINISH exit={exit_code} stdout={len(stdout_data)} stderr={len(stderr_data)}",
            agent=agent,
        )

        # Renouvellement du claim pendant l'exécution longue (heartbeat)
        # Note : déjà terminé ici, mais le claim est conservé pour la publication

    except subprocess.TimeoutExpired:
        error_msg = f"TIMEOUT after {args.run_budget + 30}s"
        log(f"RUN_TIMEOUT task_id={task_id}", agent=agent, level="ERROR")
    except Exception as e:
        error_msg = f"LAUNCH_ERROR: {e}"
        log(f"RUN_ERROR task_id={task_id} error={e}", agent=agent, level="ERROR")
        log(traceback.format_exc(), agent=agent, level="ERROR")

    duration = time.monotonic() - start

    # ── Extraction du résultat depuis stream-json Hermes ──────────────────
    # Format réel : {"type": "result", "exit_code": 0, "text": "..."}
    hermes_output = ""
    if exit_code == 0 and stdout_data:
        for line in reversed(stdout_data):
            line = line.strip()
            if not line:
                continue
            try:
                event = json.loads(line)
                if event.get("type") == "result":
                    hermes_output = event.get("text", "")
                    break
            except json.JSONDecodeError:
                continue
        if not hermes_output:
            # fallback : concaténer les lignes text
            text_lines = []
            for line in stdout_data:
                try:
                    event = json.loads(line)
                    if event.get("type") == "text":
                        text_lines.append(event.get("text", ""))
                except json.JSONDecodeError:
                    pass
            hermes_output = "".join(text_lines)

    # Détermination du statut métier
    if exit_code == 0 and hermes_output.strip():
        status = BusinessState.COMPLETED
    elif exit_code == 0 and not hermes_output.strip():
        status = BusinessState.FAILED
        error_msg = "RESULT_INVALID: exit=0 mais sortie vide"
    else:
        status = BusinessState.FAILED
        if not error_msg:
            error_msg = f"EXIT_CODE_{exit_code}: {'; '.join(stderr_data[-3:])}"

    # ── Construction et publication du résultat ────────────────────────────
    result = make_result(
        task_id=task_id,
        agent=agent,
        success=(status == BusinessState.COMPLETED),
        output=hermes_output,
        error=error_msg,
        artifacts={
            "exit_code": exit_code,
            "stdout_lines": len(stdout_data),
            "stderr_lines": len(stderr_data),
            "workdir": workdir,
            "cmd": cmd,
            "protocol_version": PROTOCOL_VERSION,
        },
        attempt_id=claim.claim_id,
        duration_seconds=round(duration, 2),
    )

    # Écriture résultat dans Redis (clé TTL 24h)
    try:
        r.set(result_key(task_id), json.dumps(result), ex=86400)
        log(f"RESULT_PUBLISHED key={result_key(task_id)} state={status.value}", agent=agent)
    except Exception as e:
        log(f"RESULT_PUBLISH_ERROR error={e}", agent=agent, level="ERROR")
        # Fallback : écritre locale
        checkpoint.write_text(json.dumps(result, indent=2))

    # Mise à jour task state
    try:
        r.set(task_key(task_id), json.dumps({
            "task_id": task_id,
            "agent": agent,
            "state": status.value,
            "result_key": result_key(task_id),
            "updated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        }), ex=86400)
    except Exception:
        pass

    # Checkpoint local (preuve même si Redis down)
    try:
        checkpoint.write_text(json.dumps(result, indent=2))
    except Exception:
        pass

    return result


# ── Point d'entrée ──────────────────────────────────────────────────────────
def main() -> int:
    parser = argparse.ArgumentParser(description="Fleet Hermes Launcher (non-interactif)")
    parser.add_argument("--agent", required=True, help="agent_id logique")
    parser.add_argument("--task-id", required=True, help="task_id unique")
    parser.add_argument("--query-file", required=True, help="chemin vers le fichier d'instructions (lu par Hermes, pas shell)")
    parser.add_argument("--profile", help="profil Hermes (isolation config/skill)")
    parser.add_argument("--provider", default=os.environ.get("HERMES_PROVIDER", "nous"))
    parser.add_argument("--model", default=os.environ.get("HERMES_MODEL", "meituan/longcat-2.0:free"))
    parser.add_argument("--worktree", action="store_true")
    parser.add_argument("--accept-hooks", action="store_true")
    parser.add_argument("--max-turns", type=int, default=150)
    parser.add_argument("--run-budget", type=int, default=600)
    parser.add_argument("--session-id", help="ID de session Hermes à reprendre")
    parser.add_argument("--workspace-dir", help="répertoire de travail dédié")
    parser.add_argument("--env-file", help="fichier .env additionnel")
    parser.add_argument("--dry-run", action="store_true", help="affiche la cmd sans l'exécuter")
    args = parser.parse_args()

    # Disque de log
    LOG_DIR.mkdir(parents=True, exist_ok=True)

    # Redis
    try:
        r = get_redis()
        r.ping()
        log("REDIS_CONNECTED", agent=args.agent)
    except Exception as e:
        print(f"REDIS_CONNECT_FAILED: {e}", file=sys.stderr)
        return 2

    # Claim
    claim = TaskClaim(r, args.agent, args.task_id)
    if not claim.acquire():
        log(f"ABORT task already claimed", agent=args.agent)
        return 3

    try:
        # Construction commande
        cmd = build_hermes_cmd(args)
        log(f"CMD {' '.join(cmd)}", agent=args.agent)

        if args.dry_run:
            print(" ".join(cmd))
            return 0  # finally releases

        # Exécution
        result = run_task(
            r, args.agent, args.task_id, cmd,
            workdir=args.workspace_dir,
            env_file=args.env_file,
            claim=claim,
            msg_run_budget=args.run_budget,
        )

        # Sortie stdout = résultat JSON (pour chaînage)
        print(json.dumps(result, ensure_ascii=False))

        return 0 if result["success"] else 1

    finally:
        claim.release()


if __name__ == "__main__":
    args = None  # pour pytest coverage
    sys.exit(main())
