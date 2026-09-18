# Pilote Migration v4.1 — tmux → launcher

## Résumé

Migration du transport des agents de tmux vers Redis Lists + launcher non-interactif.
Pilote réalisé sur l'agent **dev-web** avec une tâche réelle (création de documentation + issue GitHub + PR + CI).

**Statut** : ✅ Pilote terminé — le nouveau transport est actif pour dev-web.

## Architecture réelle

```
Redis queue:<agent> ──▶ RPOPLPUSH atomique ──▶ processing:<agent>
                                                     │
                                                     ▼
                                            fleet_relay_v4_1.py
                                                     │
                                                     ▼
                                            fleet_launcher.py
                                                     │
                                                     ▼
                                    hermes chat --query-file --oneshot -Q --format stream-json
                                                     │
                                                     ▼
                                    result:<task_id> + inbox:<reply_to>
                                                     │
                                                     ▼
                                            ACK : LREM processing + SET msg:done:<id>
```

## Composants déployés (production)

| Composant | Chemin | Rôle |
|-----------|--------|------|
| fleet_protocol.py | `/opt/fleet/protocol/` | Schéma v1.0.0, builders, validateurs |
| fleet_launcher.py | `/opt/fleet/launcher/` | Exécute Hermes en subprocess, capture le résultat, publie dans Redis |
| fleet_relay_v4_1.py | `/opt/fleet/launcher/` | BRPOP → RPOPLPUSH → launcher → ACK |
| fleet-relay-v4.1@.service | `/etc/systemd/system/` | Unit template par agent, supervisé |
| fleet_migrate.py | `/opt/fleet/migration/` | Bascule contrôlée agent par agent avec rollback |
| fleet_monitor.sh | `/opt/fleet/monitoring/` | Bilan rapide pour conductor-ops |

## Cycle de vie d'un message

1. **Publication** : `LPUSH queue:<agent> <payload_json>`
2. **Réservation atomique** : `RPOPLPUSH queue:<agent> processing:<agent>`
3. **Validation** : schéma v1.0.0 (version, id, type, from, to, task_id, body)
4. **Query-file** : écriture dans `/tmp/fleet/queries/<agent>/<task_id>.txt`
5. **Claim atomique** : `SET NX EX` sur `claim:<task_id>` (launcher)
6. **Exécution** : `hermes chat --query-file ... --oneshot -Q --format stream-json`
7. **Résultat** : `SET result:<task_id>` + `RPUSH inbox:<reply_to>`
8. **ACK** : `LREM processing:<agent>` + `SET msg:done:<id>` (TTL 24h)

### Garanties démontrées

| Garantie | Mécanisme | Preuve |
|----------|-----------|--------|
| **Non-perte** | `RPOPLPUSH` atomique : message jamais entre deux | Test `test_crash_recovery` : message reste dans `processing:<agent>` après kill du relay |
| **Non-double** | `msg:done:<id>` + claim atomique (`SET NX`) | Test `test_recovery_with_existing_result` : résultat republié sans re-exécution |
| **Récupération** | `reconcile_processing()` au démarrage | Réconcilie `processing:<agent>` → re-traitement ou ACK si résultat existant |

### Limites connues

- **Aucune garantie "exactement-une-fois" sur les effets externes** : un push/PR/commentaire peut être dupliqué si le crash survient entre l'effet et l'ACK. La déduplication est best-effort (commit SHA comme idempotency key).
- **Pas de DLQ (dead letter queue) formelle** : les messages en erreur restent dans `processing:<agent>` indéfiniment. Une DLQ doit être ajoutée pour la production long terme.
- **Claim TTL fixe (300s)** : si Hermes dépasse ce budget, le claim expire et un autre relay peut reprendre la tâche. Le heartbeat pendant l'exécution n'est pas implémenté (PR #699 a un run-budget de 600s, le claim TTL devrait être ≥ run-budget + marge).
- **Pas de chiffrement du contenu des messages** : les instructions et résultats sont en clair dans Redis. Acceptable dans un réseau privé (172.16.12.0/24).

## Commandes de référence

```bash
# Migrer un agent vers le nouveau transport
python3 /opt/fleet/migration/fleet_migrate.py <agent_id>

# Activer le relay v4.1 pour un agent
systemctl enable --now fleet-relay-v4.1@<agent_id>

# Vérifier l'état
systemctl status fleet-relay-v4.1@<agent_id>

# Monitoring rapide
bash /opt/fleet/monitoring/fleet_monitor.sh --agent <agent_id>

# Test ping aller-retour
python3 -c "
from protocol.fleet_protocol import make_message, queue_key
import redis, json, os
pool = redis.ConnectionPool(host='172.16.12.2', port=6379, password=os.environ['REDIS_PASS'], decode_responses=True)
r = redis.Redis(connection_pool=pool)
msg = make_message(type='TEST_PING', to='dev-web', from_='conductor-ops', body='ping', task_id='ping_001', extra={'reply_to': 'conductor-ops'})
r.rpush(queue_key('dev-web'), json.dumps(msg))
print(f'Publié, queue length: {r.llen(queue_key(\"dev-web\"))}')
"

# Consulter le résultat d'un agent
redis-cli -h 172.16.12.2 -p 6379 -a $REDIS_PASS GET result:<task_id>

# Consulter l'inbox d'un agent
redis-cli -h 172.16.12.2 -p 6379 -a $REDIS_PASS LRANGE inbox:<agent> 0 -1

# Vérifier les claims actifs (doit être vide si tout est ACK)
redis-cli -h 172.16.12.2 -p 6379 -a $REDIS_PASS KEYS 'claim:*'

# Vérifier les messages en attente de traitement
redis-cli -h 172.16.12.2 -p 6379 -a $REDIS_PASS KEYS 'processing:*'
redis-cli -h 172.16.12.2 -p 6379 -a $REDIS_PASS LLEN processing:<agent>
```

## Rollback (par agent)

**Objectif** : désactiver le nouveau transport et restaurer l'ancien sans perte ni double exécution.

```bash
#!/bin/bash
# rollback_agent.sh — Retour au mode tmux pour un agent
AGENT="$1"
REDIS_CLI="redis-cli -h 172.16.12.2 -p 6379 -a $REDIS_PASS"

echo "[1/5] Arrêt du relay v4.1 pour $AGENT"
systemctl stop fleet-relay-v4.1@$AGENT
systemctl disable fleet-relay-v4.1@$AGENT

echo "[2/5] Réconciliation des messages en cours"
# Les messages dans processing:<agent> doivent être réinjectés dans queue:<agent>
# ou ACK selon leur état
MSG_COUNT=$($REDIS_CLI LLEN processing:$AGENT)
if [ "$MSG_COUNT" -gt 0 ]; then
    echo "    $MSG_COUNT messages en cours de traitement"
    # Option A : réinjecter dans la queue (seront repris par l'ancien relay)
    # $REDIS_CLI RPOPLPUSH processing:$AGENT queue:$AGENT
    # Option B : attendre la fin manuelle si Hermes tourne encore
    echo "    ATTENTRE la fin d'exécution ou ACK manuel"
fi

echo "[3/5] Vérification qu'aucun launcher n'est actif"
pgrep -f "fleet_launcher.py.*--agent $AGENT" && {
    echo "    ATTENTION : launcher encore actif, attente ou kill manuel"
    exit 1
}

echo "[4/5] Nettoyage des claims"
# Les claims expirés (TTL) seront nettoits automatiquement
# Forcer la suppression si nécessaire :
# $REDIS_CLI KEYS 'claim:*' | xargs -I{} $REDIS_CLI DEL {}

echo "[5/5] Activation de l'ancien relay pour $AGENT"
# L'ancien relay.py tourne déjà pour les autres agents
# Il reprend automatiquement la consommation de queue:<agent>
echo "    Rollback terminé pour $AGENT"
echo "    Vérifier : systemctl status fleet-relay-v4.1@$AGENT (doit être inactive)"
echo "    Vérifier : queue:<agent> consommée par l'ancien relay"
```

## Résultats du pilote

### Métriques réelles

| Métrique | Valeur |
|----------|--------|
| Agent migré | `dev-web` |
| Service actif | `fleet-relay-v4.1@dev-web` (systemd, PID 1619998) |
| Durée d'exécution | 195.09 secondes (Hermes → PR) |
| Issue créée | [#698](https://github.com/canatac/misfits-web/issues/698) |
| PR ouverte | [#699](https://github.com/canatac/misfits-web/pull/699) |
| Commit SHA | `2fafe01` (docs) + [SHA launcher/relay] |
| CI | ✅ 7 checks verts |
| msg_id | `msg_9ae8dc5f0a7f4ffa` |
| task_id | `task_pilote_v41_001` |
| attempt_id | `claim_1620839_1789719838` |
| Result publié | `result:task_pilote_v41_001` + `inbox:scrum-master` |
| Résultat | `success=true`, `state=COMPLETED` |

### Tests validés

| Test | Fichier | Résultat |
|------|---------|----------|
| Schéma message (8 tests) | `tests/test_fleet_protocol.py` | ✅ 8/8 OK |
| Claim/release TaskClaim (3 tests) | `tests/test_fleet_protocol.py` | ✅ 3/3 OK |
| E2E stub launcher | `tests/test_integration_relay.py` | ✅ 2/2 OK |
| Crash recovery (non-perte) | `tests/test_recovery.py` | ✅ OK |
| Doublon (dédup) | `tests/test_recovery.py` | ✅ OK |
| Parsing stream-json réel | Manuel | ✅ OK |

## Observabilité

### Métriques Prometheus (redis_exporter)

- Port : `9121`
- Endpoint : `http://localhost:9121/metrics`
- Métriques utilisées : `redis_connected_clients`, `redis_commands_total`, `redis_db_keys`, `redis_keyspace_hits/misses`

### Commandes redis-cli en lecture seule

```bash
# Connexion (auth via env)
export REDIS_PASS="..."
redis-cli -h 172.16.12.2 -p 6379 -a $REDIS_PASS

# Diagnostic non-destructif
SCAN 0 MATCH "queue:*"          # Files d'attente
SCAN 0 MATCH "processing:*"     # En cours
SCAN 0 MATCH "claim:*"          # Claims actifs
SCAN 0 MATCH "result:*"         # Résultats
SCAN 0 MATCH "msg:done:*"       # Déduplication

LLEN queue:<agent>              # Nombre de messages en attente
LLEN processing:<agent>         # En cours de traitement
TTL claim:<task_id>             # Expiration du claim
GET result:<task_id>            # Dernier résultat
```

### Dashboard Grafana (à raccorder)

- Source : `redis_exporter` (`http://localhost:9121`)
- Panneaux requis :
  - Queue length par agent (gauge)
  - Processing length par agent (gauge)
  - Claims actifs (table)
  - Résultats en attente (gauge)
  - Messages DLQ (gauge)
  - Délais de prise en charge (histogram)
  - Erreurs/reprises (counter)

## SHA du relay/launcher déployés

- **Commit pilote** : `2fafe01` (docs)
- **Code launcher/relay** : fichiers dans `/opt/fleet/` (à versionner dans un tag git distinct pour référence)

## Prochaines étapes

1. Le Scrum Master consomme le résultat et transmet au PO
2. Corriger la PR #699 avec les vrais SHA
3. Attribuer une 2nde tâche fonctionnelle à dev-web
4. Généraliser aux autres développeurs (testeur, UX, etc.)
5. Ajouter une DLQ pour les messages en erreur persistants
6. Implémenter le heartbeat du claim pendant l'exécution longue
