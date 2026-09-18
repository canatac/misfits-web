#!/usr/bin/env python3
"""
test_recovery.py — Test de récupération après crash du relay.

Scénario :
1. Démarrer un relay, le tuer en plein traitement (simule crash)
2. Vérifier que le message est dans processing:<agent>
3. Redémarrer le relay → réconciliation doit le récupérer
4. Vérifier que le résultat est publié sans double exécution
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from protocol.fleet_protocol import (
    make_message,
    queue_key,
    inbox_key,
    claim_key,
    result_key,
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


STUB_SLOW_LAUNCHER = """#!/usr/bin/env python3
import sys, json, time
# Parse --key value pairs
args = {}
key = None
for a in sys.argv[1:]:
    if a.startswith('--'):
        key = a[2:]
        args[key] = None
    elif key is not None:
        args[key] = a
        key = None

# Simule un traitement long (le relay sera tué pendant ce temps)
time.sleep(5)

print(json.dumps({
    "success": True, "state": "COMPLETED",
    "task_id": args.get("task-id"),
    "from": args.get("agent"),
    "output": "SLOW_STUB_EXECUTED",
    "attempt_id": "claim_slow",
    "duration_seconds": 5.0,
    "ts": "2026-09-18T09:00:00Z"
}))
"""


def test_crash_recovery():
    """
    Test : le relay meurt pendant le traitement, le message doit être récupéré.
    """
    r = rcli()
    stub = "/tmp/fleet_stub_slow.py"
    with open(stub, "w") as f:
        f.write(STUB_SLOW_LAUNCHER)
    os.chmod(stub, 0o755)

    agent = "test-crash-agent"
    sender = "conductor-ops"

    # Nettoyage complet
    for k in [queue_key(agent), inbox_key(sender), f"processing:{agent}", claim_key("task_crash")]:
        r.delete(k)
    r.delete(f"msg:done:msg_crash_001")

    # Publication d'un message avec ID fixe
    msg = make_message(
        type="TICKET_ASSIGN",
        to=agent,
        from_=sender,
        body="Tâche test crash recovery.",
        task_id="task_crash",
        extra={"reply_to": sender},
    )
    msg["id"] = "msg_crash_001"  # ID fixe pour le test
    r.rpush(queue_key(agent), json.dumps(msg))
    print(f"[1/6] Publié dans {queue_key(agent)}")

    # Lancement du relay en arrière-plan (il va bloquer sur le sleep 10 du stub)
    env = os.environ.copy()
    env["LAUNCHER_BIN"] = stub
    env["REDIS_PASS"] = REDIS_PASS
    env["BRPOP_TIMEOUT"] = "2"

    relay_proc = subprocess.Popen(
        [sys.executable, "/opt/fleet/launcher/fleet_relay_v4_1.py", agent],
        stdout=subprocess.PIPE, stderr=subprocess.PIPE, env=env,
    )

    # Attendre que le relay ait démarré et commencé le traitement
    time.sleep(4)
    print(f"[2/6] Relay PID={relay_proc.pid} en cours de traitement (stub sleep 10s)")

    # Vérifier que le message est dans processing:<agent>
    processing_len = r.llen(f"processing:{agent}")
    print(f"[3/6] processing:{agent} longueur={processing_len} (doit être 1)")
    assert processing_len == 1, f"Message pas dans processing: {processing_len}"

    # SIMULATION CRASH : tuer le relay
    relay_proc.kill()
    relay_proc.wait(timeout=5)
    print(f"[4/6] Relay tué (simulation crash)")

    # Vérifier que le message est TOUJOURS dans processing
    processing_len = r.llen(f"processing:{agent}")
    print(f"    processing:{agent} longueur={processing_len} après crash (doit être 1)")
    assert processing_len == 1, f"Message perdu après crash!"

    # Redémarrer le relay (réconciliation)
    print(f"[5/6] Redémarrage du relay (réconciliation)...")
    relay_proc2 = subprocess.Popen(
        [sys.executable, "/opt/fleet/launcher/fleet_relay_v4_1.py", agent],
        stdout=subprocess.PIPE, stderr=subprocess.PIPE, env=env,
    )

    # Attendre la récupération avec polling (max 30s)
    print(f"    Attente récupération...")
    for attempt in range(30):
        time.sleep(1)
        inbox_len = r.llen(inbox_key(sender))
        if inbox_len > 0:
            print(f"    Récupération détectée après {attempt+1}s")
            break
    else:
        print(f"    Timeout en attente récupération")

    # Vérifications
    processing_len = r.llen(f"processing:{agent}")
    print(f"    processing:{agent} longueur={processing_len} après recovery (doit être 0)")
    assert processing_len == 0, f"Message pas ACK après recovery!"

    inbox_len = r.llen(inbox_key(sender))
    print(f"    inbox:{sender} longueur={inbox_len} (doit être 1)")
    assert inbox_len > 0, "Pas de résultat après recovery!"

    resp = json.loads(r.lindex(inbox_key(sender), 0))
    print(f"[6/6] Résultat: success={resp['success']} task_id={resp['task_id']}")
    assert resp["success"] is True

    # Nettoyage
    relay_proc2.kill()
    for k in [queue_key(agent), inbox_key(sender), f"processing:{agent}"]:
        r.delete(k)

    print("\n=== TEST CRASH RECOVERY OK ===")


def test_recovery_with_existing_result():
    """
    Test : le launcher a produit le résultat mais le relay est mort avant ACK.
    Le nouveau relay doit détecter le résultat existant et le republier sans re-exécuter.
    """
    r = rcli()
    agent = "test-recovery-result"
    sender = "conductor-ops"
    task_id = "task_recovery_result"
    msg_id = "msg_recovery_result_001"

    for k in [queue_key(agent), inbox_key(sender), f"processing:{agent}",
              claim_key(task_id), result_key(task_id)]:
        r.delete(k)
    r.delete(f"msg:done:{msg_id}")

    # Simuler un résultat déjà produit par le launcher
    existing_result = {
        "id": "res_recovery",
        "version": "1.0.0",
        "type": "RESULT",
        "task_id": task_id,
        "from": agent,
        "success": True,
        "state": "COMPLETED",
        "output": "Résultat produit avant crash",
        "attempt_id": "claim_old",
        "duration_seconds": 5.0,
        "ts": "2026-09-18T09:00:00Z",
    }
    r.set(result_key(task_id), json.dumps(existing_result), ex=86400)

    # Message dans processing
    msg = make_message(
        type="TICKET_ASSIGN",
        to=agent,
        from_=sender,
        body="Tâche avec résultat existant.",
        task_id=task_id,
        extra={"reply_to": sender},
    )
    msg["id"] = msg_id
    r.rpush(f"processing:{agent}", json.dumps(msg))

    print(f"[1/3] Message dans processing:<{agent}> avec résultat existant dans result:<{task_id}>")

    # Démarrer le relay (mode une seule fois)
    env = os.environ.copy()
    env["LAUNCHER_BIN"] = "/tmp/fleet_stub_slow.py"
    env["REDIS_PASS"] = REDIS_PASS

    result = subprocess.run(
        [sys.executable, "/opt/fleet/launcher/fleet_relay_v4_1.py", agent, "--once"],
        capture_output=True, text=True, env=env, timeout=30,
    )
    print(f"[2/3] Relay exit={result.returncode}")

    inbox_len = r.llen(inbox_key(sender))
    print(f"    inbox:{sender} longueur={inbox_len} (doit être 1, résultat republié sans re-exécution)")
    assert inbox_len == 1, f"Le résultat existant n'a pas été republié: inbox={inbox_len}"

    resp = json.loads(r.lindex(inbox_key(sender), 0))
    assert resp["output"] == "Résultat produit avant crash"

    print(f"[3/3] Résultat republié sans re-exécution: OK")

    # Nettoyage
    for k in [queue_key(agent), inbox_key(sender), f"processing:{agent}", result_key(task_id)]:
        r.delete(k)
    r.delete(f"msg:done:{msg_id}")

    print("\n=== TEST RECOVERY WITH RESULT OK ===")


if __name__ == "__main__":
    print("=" * 60)
    print("TEST RÉCUPÉRATION APRÈS CRASH")
    print("=" * 60)
    test_crash_recovery()
    print()
    test_recovery_with_existing_result()
