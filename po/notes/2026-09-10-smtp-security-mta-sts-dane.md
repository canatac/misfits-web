# Veille Marché — Cycle 2026-09-10 (tick 3)
> Focus: sécurité transport SMTP (MTA-STS / DANE)

## Contexte
En 2026, la sécurité du transport SMTP est devenue critique. Deux standards coexistent pour prévenir les attaques de downgrade et man-in-the-middle sur les échanges email :

### MTA-STS (RFC 8461)
- Déclare la capacité d'un domaine à recevoir en TLS
- Mode "enforce" = refuse si TLS non disponible
- Faiblesse : le lookup DNS TXT initial n'est pas protégé → vulnérable au spoofing
- Adoption rapide : Gmail, Microsoft, Yahoo le supportent

### DANE / TLSA (RFC 6698 / RFC 7672)
- Lie le certificat TLS au domaine via DNSSEC
- Plus sécurisé que MTA-STS (pas de faille de bootstrap)
- Nécessite DNSSEC (encore ~40% des TLD, mais 86% des .gov)
- Recommandé pour réseaux gouvernementaux/sensibles

### TLS-RPT (RFC 8460)
- Reporting des échecs TLS (complément à MTA-STS/DANE)
- Permet de diagnostiquer les problèmes de livraison

## Implication misfits.ai Mail
1. **MTA-STS devrait être activé par défaut** sur notre infrastructure SMTP (Scaleway)
2. **DANE/TLSA** à prévoir pour les utilisateurs avancés avec DNSSEC
3. **TLS-RPT** pour le monitoring de livrailité

## Différenciation
- Proton Mail : E2E + MTA-STS natif
- Fastmail : MTA-STS, pas DANE
- Notre positionnement : SMTP natif + DKIM service + MTA-STS = livrailité garantie

## Recommandation PO
Créer issue technique pour activer MTA-STS côté envoi (outbound) et réception (inbound).
