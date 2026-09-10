# Veille Marché — misfits.ai Mail
> Cycle: 2026-09-10 | Source: web_search

## Tendance clés (2026)

### 1. Chiffrement zero-access = standard minimum
- Proton Mail (Suisse) zéro-access + code open-source audité.
- Tuta/Tutanota positionnement similaire.
- **Insight**: En 2026, le chiffrement E2E n'est plus un différenciateur mais une baseline.

### 2. Hey (Basecamp) = workflow > privacy
- Positionnement: "Imbox" (screening), Feed (newsletters), Paper Trail.
- Pas d'E2E mais blocage trackers par défaut.
- **Insight**: L'UX prime sur la crypto pour le marché grand public fatigué de Gmail.

### 3. Fastmail = modèle "policy-based" privacy
- Hébergement Australie (Five Eyes) = risque juridique.
- Pas d'E2E mais transparence + audits indépendants.
- **Insight**: La confiance par la transparence reste viable pour entreprise.

### 4. DMARC Reporting devient standard
- ForwardEmail.net l'intègre dans leurs plans payants.
- **Insight**: Reporting DMARC attendu par les pros — opportunité feature.

### 5. Aliasing Proton "Hide My Email"
- Proton permet création d'alias jetables.
- **Insight**: L'alias management est attendu (notre #423 signature multi-compte répond à cette attente).

---

## Différenciation misfits.ai recommandée
| axe | concurrent | misfits |
|-----|-----------|---------|
| E2E | Proton (natif) | ❌ à prévoir (P1) |
| DMARC reporting | ForwardEmail (intégré) | ✅ via DKIM service |
| Multi-alias signature | Proton (basique) | ✅ via issue-423 |
| Open source | Proton, Tuta | ❌ partiel |
| Local Rust infra | — | ✅ différenciant tech |

---

## Recommandations produit (ce cycle)
1. Accélérer E2E PGP seamless (aujourd'hui manquant vs Proton).
2. Dashboard DMARC reporting auto (force unique vs Fastmail).
3. Alias + signature = onboarding killer feature (en cours via #423).
