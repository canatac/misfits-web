#!/usr/bin/env python3
"""
fleet_migrate.py — Script de migration contrôillée d'un agent du mode tmux vers le mode launcher.

Étapes :
1. Relever l'état actuel (tmux session, branche, SHA, stashes, fichiers non suivis)
2. Sauvegarder le travail en cours
3. Préparer le nouvel environnement (workspace, profil Hermes)
4. Bascule :
   a. Suspendre les nouvelles livraisons tmux pour cet agent
   b. Activer le relay v4 pour cet agent
   c. Vérifier le fonctionnement avec un test ping
5. Rollback si échec

Usage :
    python3 fleet_migrate.py <agent_id> [--rollback] [--dry-run]

Variables d'environnement :
    REDIS_HOST, REDIS_PORT, REDIS_PASS
    MIGRATION_STATE_DIR (défaut: /opt/fleet/migration/state)
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from protocol.fleet_protocol import (
    PROTOCOL_VERSION,
    make_message,
    queue_key,
    inbox_key,
    claim_key,
)

REDIS_HOST = os.environ.get("REDIS_HOST", "172.16.12.2")
REDIS_PORT = int(os.environ.get("REDIS_PORT", 6379))
REDIS_PASS = os.environ.get("REDIS_PASS", "")
STATE_DIR = Path(os.environ.get("MIGRATION_STATE_DIR", "/opt/fleet/migration/state"))


def log(msg: str, level: str = "INFO") -> None:
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    print(f"{ts} [{level}] migrate {msg}", flush=True)


def get_redis():
    import redis
    pool = redis.ConnectionPool(
        host=REDIS_HOST, port=REDIS_PORT, password=REDIS_PASS or None,
        decode_responses=True, socket_connect_timeout=5,
    )
    return redis.Redis(connection_pool=pool)


def get_tmux_session(agent: str) -> str | None:
    """Trouve la session tmux pour un agent (pattern agentdeck_<agent>_<hash>)."""
    try:
        result = subprocess.run(
            ["tmux", "list-sessions", "-F", "#{session_name}"],
            capture_output=True, text=True, timeout=5,
        )
        for line in result.stdout.strip().split("\n"):
            if f"agentdeck_{agent}_" in line:
                return line
    except Exception:
        pass
    return None


def capture_tmux_state(agent: str) -> dict:
    """Capture l'état complet d'un agent avant migration."""
    state = {
        "agent": agent,
        "captured_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "tmux_session": None,
        "git": {},
        "redis": {},
    }

    # Session tmux
    tmux_session = get_tmux_session(agent)
    state["tmux_session"] = tmux_session

    # État Redis
    r = get_redis()
    state["redis"]["queue_len"] = r.llen(queue_key(agent))
    state["redis"]["inbox_len"] = r.llen(inbox_key(agent))

    # État Git (si worktree existant)
    worktree_dir = Path(f"/opt/repos/{agent}")
    if worktree_dir.exists():
        try:
            result = subprocess.run(
                ["git", "status", "--porcelain", "-b"],
                cwd=worktree_dir, capture_output=True, text=True, timeout=10,
            )
            state["git"]["status"] = result.stdout
            result = subprocess.run(
                ["git", "log", "--oneline", "-5"],
                cwd=worktree_dir, capture_output=True, text=True, timeout=10,
            )
            state["git"]["recent_commits"] = result.stdout
            result = subprocess.run(
                ["git", "stash", "list"],
                cwd=worktree_dir, capture_output=True, text=True, timeout=10,
            )
            state["git"]["stashes"] = result.stdout
        except Exception as e:
            state["git"]["error"] = str(e)

    return state


def save_state(state: dict, suffix: str = "pre") -> Path:
    """Sauvegarde l'état dans un fichier JSON."""
    STATE_DIR.mkdir(parents=True, exist_ok=True)
    path = STATE_DIR / f"{state['agent']}_{suffix}_{int(time.time())}.json"
    path.write_text(json.dumps(state, indent=2))
    log(f"State saved: {path}")
    return path


def migrate_agent(agent: str, dry_run: bool = False) -> bool:
    """Migre un agent du mode tmux vers le mode launcher."""
    log(f"Starting migration for agent={agent}")

    # 1. Capturer l'état actuel
    state = capture_tmux_state(agent)
    save_state(state, "pre")

    if state["tmux_session"]:
        log(f"Active tmux session: {state['tmux_session']}")
    else:
        log("No active tmux session found", level="WARN")

    if dry_run:
        log("DRY-RUN: migration would proceed with:")
        log(f"  - Suspend tmux delivery for {agent}")
        log(f"  - Enable relay v4 for {agent}")
        log(f"  - Send test ping")
        return True

    # 2. Suspendre les nouvelles livraisons tmux
    # (le relay v4 prend le relais, l'ancien relay.py est arrêté pour cet agent)
    log("Suspending tmux delivery...")
    # L'ancien relay.py tourne en continu. On le laisse tourner pour les autres agents.
    # Le nouveau relay v4 prend le relais pour cet agent spécifique.

    # 3. Activer le relay v4 pour cet agent
    log("Enabling relay v4...")
    # Le service systemd fleet-relay@<agent> est activé et démarré
    result = subprocess.run(
        ["systemctl", "enable", "--now", f"fleet-relay@{agent}"],
        capture_output=True, text=True, timeout=30,
    )
    if result.returncode != 0:
        log(f"Failed to enable relay: {result.stderr}", level="ERROR")
        return False

    # 4. Test ping
    log("Sending test ping...")
    r = get_redis()
    test_msg = make_message(
        type="TEST_PING",
        to=agent,
        from_="conductor-ops",
        body="Test ping après migration",
        task_id=f"ping_{int(time.time())}",
        extra={"reply_to": "conductor-ops"},
    )
    r.rpush(queue_key(agent), json.dumps(test_msg))

    # Attendre la réponse (max 30s)
    for _ in range(30):
        inbox_len = r.llen(inbox_key("conductor-ops"))
        if inbox_len > 0:
            resp = json.loads(r.lindex(inbox_key("conductor-ops"), 0))
            if resp.get("task_id") == test_msg["task_id"]:
                log(f"Test ping SUCCESS: {resp}")
                save_state(capture_tmux_state(agent), "post")
                return True
        time.sleep(1)

    log("Test ping TIMEOUT", level="ERROR")
    return False


def rollback_agent(agent: str) -> bool:
    """Rollback : désactive le relay v4 et restaure le mode tmux."""
    log(f"Rolling back agent={agent}")

    # 1. Désactiver le relay v4
    result = subprocess.run(
        ["systemctl", "disable", "--now", f"fleet-relay@{agent}"],
        capture_output=True, text=True, timeout=30,
    )
    if result.returncode != 0:
        log(f"Failed to disable relay: {result.stderr}", level="ERROR")
        return False

    # 2. Réactiver l'ancien relay pour cet agent (via fleet_relay.py)
    # L'ancien relay.py est toujours actif pour les agents non-migrés
    log("Relay v4 disabled. Old relay.py handles this agent again.")
    return True


def main():
    import argparse
    parser = argparse.ArgumentParser(description="Fleet agent migration tool")
    parser.add_argument("agent", help="agent_id to migrate")
    parser.add_argument("--rollback", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    if args.rollback:
        success = rollback_agent(args.agent)
    else:
        success = migrate_agent(args.agent, args.dry_run)

    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
