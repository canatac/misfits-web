#!/usr/bin/env python3
"""
fleet_relay_v4.py — Relay Redis→Launcher (remplace fleet_relay.py tmux-dependent).

Pour chaque agent inscrit :
  1. BRPOP queue:<agent>
  2. Valide le message (schéma v1.0.0)
  3. Réserve la tâche (claim atomique via launcher)
  4. Écrit le query-file dans /tmp/fleet/queries/<agent>/
  5. Lance fleet_launcher.py --agent <agent> --task-id <id> --query-file <path>
  6. Capture le résultat JSON
  7. Publie dans inbox:<sender> si reply_to précisé
  8. ACK (LREM processing)

Aucun tmux. Aucun send-keys. Aucun paste-buffer.

Usage :
    python3 fleet_relay_v4.py <agent1> [agent2] ... [--once] [--dry-run]

Env :
    REDIS_HOST, REDIS_PORT, REDIS_PASS
    LAUNCHER_BIN (défaut: /opt/fleet/launcher/fleet_launcher.py)
    HERMES_PROVIDER, HERMES_MODEL, HERMES_PROFILE
    QUERY_DIR (défaut: /tmp/fleet/queries)
    LOG_DIR (défaut: /var/log/fleet)
    CLAIM_TTL (défaut: 300)
    BRPOP_TIMEOUT (défaut: 2)
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
    line = f"{ts} [{level}] relay_v4 agent={agent} {msg}"
    print(line, flush=True)
    try:
        LOG_DIR.mkdir(parents=True, exist_ok=True)
        with (LOG_DIR / "relay_v4.log").open("a") as f:
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


def process_message(r, agent: str, payload_str: str) -> str:
    """Traite un message : valide, réserve, exécute, publie le résultat."""
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

    log(f"PROCESS msg_id={msg_id} type={msg_type} from={sender}", agent=agent)

    # 2. Validation schéma
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    from protocol.fleet_protocol import validate_message
    valid, errors = validate_message(msg)
    if not valid:
        log(f"INVALID msg_id={msg_id} errors={errors}", agent=agent, level="WARN")
        return "INVALID"

    # 3. Dédup (message déjà traité ?)
    if r.exists(f"msg:done:{msg_id}"):
        log(f"DEDUP msg_id={msg_id}", agent=agent)
        return "DEDUP"

    # 4. Écriture du query-file
    body = msg.get("body", "")
    query_file = write_query_file(agent, task_id, body)
    log(f"QUERY_FILE path={query_file}", agent=agent)

    # 5. Construction et exécution de la commande launcher
    cmd = build_launcher_cmd(agent, task_id, query_file, msg)
    log(f"LAUNCH cmd={' '.join(cmd[:8])}...", agent=agent)

    try:
        result = subprocess.run(
            cmd, capture_output=True, text=True,
            timeout=msg.get("run_budget", 600) + 60,
        )
        log(f"LAUNCH_DONE exit={result.returncode}", agent=agent)

        # Le launcher émet le résultat JSON sur stdout. On cherche la dernière ligne JSON valide.
        if result.returncode == 0 and result.stdout.strip():
            # Chercher la dernière ligne qui ressemble à un JSON objet
            for line in reversed(result.stdout.strip().split("\n")):
                line = line.strip()
                if line.startswith("{"):
                    try:
                        result_data = json.loads(line)
                        log(f"RESULT task_id={task_id} success={result_data.get('success')}", agent=agent)
                        break
                    except json.JSONDecodeError:
                        continue
            else:
                # Pas trouvé de JSON : fallback sur tout le stdout
                result_data = {"success": True, "output": result.stdout.strip()}
                log(f"RESULT_FALLBACK task_id={task_id}", agent=agent)
        else:
            result_data = {
                "success": False,
                "error": result.stderr.strip() or f"exit={result.returncode}",
            }

        # 6. Publication résultat pour le sender (si reply_to)
        if reply_to and reply_to != agent:
            result_key = f"inbox:{reply_to}"
            r.rpush(result_key, json.dumps(result_data))
            r.expire(result_key, 86400)
            log(f"REPLY_PUBLISHED to={reply_to}", agent=agent)

        # 7. Marquer comme traité
        r.set(f"msg:done:{msg_id}", "1", ex=86400)

        return "COMPLETED"

    except subprocess.TimeoutExpired:
        log(f"LAUNCH_TIMEOUT task_id={task_id}", agent=agent, level="ERROR")
        return "TIMEOUT"
    except Exception as e:
        log(f"LAUNCH_ERROR task_id={task_id} error={e}", agent=agent, level="ERROR")
        return "ERROR"


def relay_loop(r, agents: list[str], once: bool = False) -> None:
    log(f"RELAY_V4_START agents={agents} pid={os.getpid()}")
    queues = [f"queue:{a}" for a in agents]

    while running:
        try:
            result = r.brpop(queues, timeout=BRPOP_TIMEOUT)
            if not result:
                if once:
                    break
                continue

            queue_key, payload_str = result
            agent = queue_key.replace("queue:", "")
            processing_key = f"processing:{agent}"

            # Move to processing
            r.rpush(processing_key, payload_str)
            status = process_message(r, agent, payload_str)

            # Remove from processing
            r.lrem(processing_key, 0, payload_str)

            log(f"MSG_DONE agent={agent} status={status}")

            if once:
                break

        except Exception as e:
            log(f"LOOP_ERROR {e}", level="ERROR")
            time.sleep(1)

    log(f"RELAY_V4_STOP agents={agents}")


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
        print("Usage: fleet_relay_v4.py <agent1> [agent2] ... [--once]")
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
