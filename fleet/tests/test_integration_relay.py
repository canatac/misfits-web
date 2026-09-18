#!/usr/bin/env python3
"""
test_integration_relay.py — Test d'intégration bout en bout du relay v4.

Un stub launcher simule l'exécution Hermes sans appel API.
Valide : publication → consommation → résultat publié dans inbox → ACK.
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
import tempfile

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from protocol.fleet_protocol import (
    make_message,
    queue_key,
    inbox_key,
)

REDIS_HOST = os.environ.get("REDIS_HOST", "172.16.12.2")
REDIS_PORT = int(os.environ.get("REDIS_PORT", 6379))
REDIS_PASS = os.environ.get("REDIS_PASS", "OTn1WGEUUNsLJDQ3xfokPcxVe75YgtbMdvoPKLzW")

import redis

def rcli():
    pool = redis.ConnectionPool(
        host=REDIS_HOST, port=REDIS_PORT, password=REDIS_PASS,
        decode_responses=True, socket_connect_timeout=5,
    )
    return redis.Redis(connection_pool=pool)


STUB_LAUNCHER = """#!/usr/bin/env python3
import sys
import json

def parse_args(argv):
    args = {}
    key = None
    for a in argv[1:]:
        if a.startswith('--'):
            key = a[2:]
            args[key] = None
        elif key is not None:
            args[key] = a
            key = None
    return args

args = parse_args(sys.argv)
result = {
    "id": "res_" + args.get('task-id', 'x'),
    "version": "1.0.0",
    "type": "RESULT",
    "task_id": args.get('task-id'),
    "from": args.get('agent'),
    "success": True,
    "state": "COMPLETED",
    "output": "STUB_OK",
    "error": "",
    "artifacts": {"stub": True},
    "attempt_id": "claim_test",
    "duration_seconds": 0.01,
    "ts": "2026-09-18T07:00:00Z",
}
print(json.dumps(result))
"""


def test_e2e():
    r = rcli()
    stub = "/tmp/fleet_stub_launcher.py"
    with open(stub, "w") as f:
        f.write(STUB_LAUNCHER)
    os.chmod(stub, 0o755)

    agent = "test-agent-e2e"
    sender = "conductor-ops"

    for k in [queue_key(agent), inbox_key(sender)]:
        r.delete(k)

    msg = make_message(
        type="TICKET_ASSIGN",
        to=agent,
        from_=sender,
        body="Tâche test E2E.",
        task_id="task_e2e",
        extra={"reply_to": sender},
    )
    r.rpush(queue_key(agent), json.dumps(msg))
    print(f"[1/5] Publié dans {queue_key(agent)}")

    env = os.environ.copy()
    env["LAUNCHER_BIN"] = stub
    env["REDIS_PASS"] = REDIS_PASS

    result = subprocess.run(
        [sys.executable, "/opt/fleet/launcher/fleet_relay_v4.py", agent, "--once"],
        capture_output=True, text=True, env=env, timeout=30,
    )
    print(f"[2/5] Relay exit={result.returncode}")

    qlen = r.llen(queue_key(agent))
    print(f"[3/5] Queue={qlen}")
    assert qlen == 0, f"Queue non vide: {qlen}"

    inbox_len = r.llen(inbox_key(sender))
    print(f"[4/5] Inbox={inbox_len}")
    assert inbox_len > 0, "Aucune réponse dans inbox"

    resp = json.loads(r.lindex(inbox_key(sender), 0))
    print(f"[5/5] success={resp['success']} state={resp['state']}")
    assert resp["success"] is True
    assert resp["state"] == "COMPLETED"

    for k in [queue_key(agent), inbox_key(sender)]:
        r.delete(k)

    print("=== TEST E2E OK ===")


def test_unknown_recipient():
    r = rcli()
    agent = "nonexistent-agent-xyz"
    sender = "conductor-ops"
    r.delete(queue_key(agent))

    msg = make_message(
        type="TICKET_ASSIGN",
        to=agent,
        from_=sender,
        body="test",
    )
    r.rpush(queue_key(agent), json.dumps(msg))
    time.sleep(1)
    qlen = r.llen(queue_key(agent))
    print(f"[TEST] Queue={qlen} (pas de consommateur)")
    assert qlen == 1, "Le message aurait dû rester dans la queue"
    r.delete(queue_key(agent))
    print("=== TEST UNKNOWN_RECIPIENT OK ===")


if __name__ == "__main__":
    import time
    print("=" * 60)
    print("TEST INTÉGRATION RELAY v4")
    print("=" * 60)
    test_e2e()
    print()
    test_unknown_recipient()
