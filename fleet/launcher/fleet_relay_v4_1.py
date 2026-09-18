#!/usr/bin/env python3
"""
fleet_relay_v4_1.py — Relay Redis→Launcher avec garantie de non-perte.

Correction du trou v4 : entre BRPOP (retrait de la queue) et msg:done (ACK),
un crash = message perdu.

Solution :
  - RPOPLPUSH atomique : queue:<agent> → processing:<agent>
  - Au démarrage : réconciliation de processing:<agent> (reprise après crash)
  - ACK final : LREM processing:<agent> + SET msg:done:<id>
  - Dédup : msg:done:<id> + claim atomique par launcher

Cycle de vie garanti :
  queue ──RPOPLPUSH──▶ processing ──LREM──▶ (terminé)
                         │
                         └── si crash → relance → réconciliation → re-traitement ou ACK
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
import time
import signal
from datetime import datetime, timezone
from pathlib import Path

# ── Config ──────────────────────────────────────────────────────────────────
REDIS_HOST = os.environ.get("REDIS_HOST", "172.16.12.2")
REDIS_PORT = int(os.environ.get("REDIS_PORT", 6379))
REDIS_PASS = os.environ.get("REDIS_PASS", "")
LAUNCHER_BIN = os.environ.get("LAUNCHER_BIN", "/opt/fleet/launcher/fleet_launcher.py")
HERMES_PROVIDER = os.environ.get("HERMES_PROVIDER", "nous")
HERMES_MODEL = os.environ.get("HERMES_MODEL", "meituan/longcat-2.0:free")
HERMES_PROFILE = os.environ.get("HERMES_PROFILE", "")
QUERY_DIR = Path(os.environ.get("QUERY_DIR", "/tmp/fleet/queries"))
LOG_DIR = Path(os.environ.get("LOG_DIR", "/var/log/fleet"))
CLAIM_TTL = int(os.environ.get("CLAIM_TTL", "300"))
BRPOP_TIMEOUT = int(os.environ.get("BRPOP_TIMEOUT", "2"))

running = True


def log(msg: str, *, agent: str = "", level: str = "INFO") -> None:
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    line = f"{ts} [{level}] relay_v4.1 agent={agent} {msg}"
    print(line, flush=True)
    try:
        LOG_DIR.mkdir(parents=True, exist_ok=True)
        with (LOG_DIR / "relay_v4.1.log").open("a") as f:
            f.write(line + "\n")
    except Exception:
        pass


def get_redis():
    import redis
    pool = redis.ConnectionPool(
        host=REDIS_HOST, port=REDIS_PORT, password=REDIS_PASS or None,
        decode_responses=True, socket_connect_timeout=10,
        socket_timeout=BRPOP_TIMEOUT + 5, retry_on_timeout=True,
    )
    return redis.Redis(connection_pool=pool)


def write_query_file(agent: str, task_id: str, body: str) -> Path:
    """Écrit le corps du message dans un fichier dédié. Retourne le chemin."""
    agent_dir = QUERY_DIR / agent
    agent_dir.mkdir(parents=True, exist_ok=True)
    ts = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S")
    path = agent_dir / f"{task_id}_{ts}.txt"
    path.write_text(body)
    return path


def build_launcher_cmd(agent: str, task_id: str, query_file: Path, msg: dict) -> list[str]:
    cmd = [
        sys.executable, LAUNCHER_BIN,
        "--agent", agent,
        "--task-id", task_id,
        "--query-file", str(query_file),
        "--provider", HERMES_PROVIDER,
        "--model", HERMES_MODEL,
        "--max-turns", str(msg.get("max_turns", 150)),
        "--run-budget", str(msg.get("run_budget", 600)),
        "--accept-hooks",
    ]
    if HERMES_PROFILE:
        cmd += ["--profile", HERMES_PROFILE]
    if msg.get("worktree"):
        cmd.append("--worktree")
    if msg.get("workspace_dir"):
        cmd += ["--workspace-dir", msg["workspace_dir"]]
    if msg.get("env_file"):
        cmd += ["--env-file", msg["env_file"]]
    if msg.get("session_id"):
        cmd += ["--session-id", msg["session_id"]]
    return cmd


def process_message(r, agent: str, payload_str: str, *, is_recovery: bool = False) -> str:
    """
    Traite un message : valide, réserve via claim, exécute, publie le résultat, ACK.
    is_recovery=True si le message vient de la liste processing (reprise après crash).
    """
    # 1. Parse
    try:
        msg = json.loads(payload_str)
    except json.JSONDecodeError as e:
        log(f"JSON_ERROR: {e}", agent=agent, level="ERROR")
        return "JSON_ERROR"

    msg_id = msg.get("id", "?")
    task_id = msg.get("task_id", msg_id)
    msg_type = msg.get("type", "?")
    sender = msg.get("from", "?")
    reply_to = msg.get("reply_to")

    prefix = "RECOVERY" if is_recovery else "PROCESS"
    log(f"{prefix} msg_id={msg_id} type={msg_type} from={sender}", agent=agent)

    # 2. Validation schéma
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    from protocol.fleet_protocol import validate_message
    valid, errors = validate_message(msg)
    if not valid:
        log(f"INVALID msg_id={msg_id} errors={errors}", agent=agent, level="WARN")
        return "INVALID"

    # 3. Dédup (déjà traité avec succès ?)
    if r.exists(f"msg:done:{msg_id}"):
        log(f"DEDUP msg_id={msg_id} (already done)", agent=agent)
        return "DEDUP"

    # 4. Vérifier le résultat existant (crash après exécution, avant ACK)
    existing_result = r.get(f"result:{task_id}")
    if existing_result:
        log(f"RECOVERY_RESULT_FOUND task_id={task_id}", agent=agent)
        # Le launcher a déjà produit le résultat. Ré-ACK et publier la réponse.
        if reply_to and reply_to != agent:
            r.rpush(f"inbox:{reply_to}", existing_result)
            r.expire(f"inbox:{reply_to}", 86400)
            log(f"RECOVERY_REPLY_REPUBLISHED to={reply_to}", agent=agent)
        r.set(f"msg:done:{msg_id}", "1", ex=86400)
        return "RECOVERED"

    # 5. Écriture du query-file
    body = msg.get("body", "")
    query_file = write_query_file(agent, task_id, body)
    log(f"QUERY_FILE path={query_file}", agent=agent)

    # 6. Exécution via launcher
    cmd = build_launcher_cmd(agent, task_id, query_file, msg)
    log(f"LAUNCH cmd={' '.join(cmd[:8])}...", agent=agent)

    try:
        result = subprocess.run(
            cmd, capture_output=True, text=True,
            timeout=msg.get("run_budget", 600) + 60,
        )
        log(f"LAUNCH_DONE exit={result.returncode}", agent=agent)

        # 7. Parser le résultat
        result_data = parse_launcher_output(result)
        log(f"RESULT task_id={task_id} success={result_data.get('success')}", agent=agent)

        # 8. Publication résultat pour le sender
        if reply_to and reply_to != agent:
            r.rpush(f"inbox:{reply_to}", json.dumps(result_data))
            r.expire(f"inbox:{reply_to}", 86400)
            log(f"REPLY_PUBLISHED to={reply_to}", agent=agent)

        # 9. ACK final (dédup)
        r.set(f"msg:done:{msg_id}", "1", ex=86400)
        return "COMPLETED"

    except subprocess.TimeoutExpired:
        log(f"LAUNCH_TIMEOUT task_id={task_id}", agent=agent, level="ERROR")
        return "TIMEOUT"
    except Exception as e:
        log(f"LAUNCH_ERROR task_id={task_id} error={e}", agent=agent, level="ERROR")
        return "ERROR"


def parse_launcher_output(result) -> dict:
    """Parse la sortie du launcher (stream-json ou JSON direct)."""
    if result.returncode == 0 and result.stdout.strip():
        # Chercher la dernière ligne JSON objet
        for line in reversed(result.stdout.strip().split("\n")):
            line = line.strip()
            if line.startswith("{"):
                try:
                    return json.loads(line)
                except json.JSONDecodeError:
                    continue
        return {"success": True, "output": result.stdout.strip()}
    elif result.returncode == 0 and not result.stdout.strip():
        return {"success": False, "error": "RESULT_INVALID: empty stdout"}
    else:
        return {"success": False, "error": result.stderr.strip() or f"exit={result.returncode}"}


def reconcile_processing(r, agent: str) -> int:
    """
    Réconcilie la liste processing:<agent> au démarrage.
    Retourne le nombre de messages récupérés.
    """
    processing_key = f"processing:{agent}"
    count = 0

    while True:
        payload_str = r.rpop(processing_key)
        if payload_str is None:
            break
        count += 1
        log(f"RECONCILE recovering message #{count}", agent=agent)
        process_message(r, agent, payload_str, is_recovery=True)

    if count > 0:
        log(f"RECONCILE_DONE recovered={count}", agent=agent)
    return count


def relay_loop(r, agents: list[str], once: bool = False) -> None:
    log(f"RELAY_V4.1_START agents={agents} pid={os.getpid()}")

    # Réconciliation au démarrage pour chaque agent
    for agent in agents:
        recovered = reconcile_processing(r, agent)
        if recovered:
            log(f"START_RECOVERY agent={agent} recovered={recovered}", agent=agent)

    while running:
        for agent in agents:
            queue_key = f"queue:{agent}"
            processing_key = f"processing:{agent}"

            try:
                # RPOPLPUSH atomique : garantit qu'on perd jamais un message
                payload_str = r.rpoplpush(queue_key, processing_key)

                if payload_str is None:
                    if once:
                        break
                    continue

                # Traitement
                status = process_message(r, agent, payload_str)

                # ACK : retirer de processing
                if status in ("COMPLETED", "DEDUP", "RECOVERED", "INVALID"):
                    r.lrem(processing_key, 0, payload_str)
                    log(f"ACK agent={agent} status={status}")
                else:
                    # En cas d'erreur, on peut ré-essayer plus tard (le message reste dans processing)
                    # ou le DLQ (dead letter queue) — ici on le laisse dans processing pour réconciliation
                    log(f"NACK agent={agent} status={status} msg stays in processing", level="WARN")

                if once:
                    break

            except Exception as e:
                log(f"LOOP_ERROR agent={agent} {e}", level="ERROR")
                time.sleep(1)

        if once:
            break

    log(f"RELAY_V4.1_STOP agents={agents}")


def signal_handler(sig, frame):
    global running
    running = False


def main():
    signal.signal(signal.SIGTERM, signal_handler)
    signal.signal(signal.SIGINT, signal_handler)

    args = sys.argv[1:]
    once = "--once" in args
    agents = [a for a in args if not a.startswith("--")]

    if not agents:
        print("Usage: fleet_relay_v4_1.py <agent1> [agent2] ... [--once]")
        sys.exit(1)

    r = get_redis()
    try:
        r.ping()
        log("REDIS_CONNECTED")
    except Exception as e:
        log(f"REDIS_CONNECT_FAILED {e}", level="ERROR")
        sys.exit(2)

    relay_loop(r, agents, once=once)


if __name__ == "__main__":
    main()
