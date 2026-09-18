# Pilote Migration v4.1 — tmux → launcher

## Architecture

Le launcher v4.1 remplace l'injection tmux par l'exécution non-interactive d'Hermes via .

### Composants

- **fleet_protocol.py** : schéma v1.0.0, builders, validateurs
- **fleet_launcher.py** : exécute Hermes en subprocess, capture le résultat, publie dans Redis
- **fleet_relay_v4_1.py** : BRPOP Redis → RPOPLPUSH atomique → lance le launcher → ACK
- **fleet_migrate.py** : bascule contrôlée agent par agent avec rollback

### Cycle de vie d'un message

1. Publication dans queue:<agent> (Redis LPUSH)
2. RPOPLPUSH atomique vers processing:<agent>
3. Validation schéma v1.0.0
4. Écriture du query-file
5. Lancement du launcher (claim atomique)
6. Exécution Hermes (hermes chat non-interactif)
7. Publication du résultat dans result:<task_id> et inbox:<reply_to>
8. ACK : LREM processing + SET msg:done:<id>

### Garanties

- **Non-perte** : RPOPLPUSH garantit qu'un message n'est jamais perdu entre la lecture et l'ACK
- **Non-double** : msg:done:<id> + claim atomique empêchent la réexécution
- **Récupération** : au démarrage, réconciliation de processing:<agent> pour récupérer les messages en cours

### Commandes



### Résultats du pilote

- Agent migré : dev-web
- Service actif : fleet-relay-v4.1@dev-web
- Tâche livrée : création de ce document
- SHA du commit : (à remplir après merge)

### Rollback

