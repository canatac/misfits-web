# Email Authentication Monitoring API

> **Statut**: intégré (PR #685) · **Issue**: #530 · **Scope**: DKIM/SPF/DMARC frontend monitoring

Le module `email-auth-api` expose les fonctions pour interroger les endpoints de monitoring de l'authentification email côté backend (`reimagined-guide`). Il s'appuie sur les types partagés `AdminDeliverabilityDiagnosticsResponse` et `AuthCheckResult` pour garantir la cohérence front-back.

## Endpoints intégrés

| Méthode | Path | Fonction | Description |
|---------|------|----------|-------------|
| GET | `/admin/deliverability/diagnostics?window=` | `getDeliverabilityDiagnostics()` | Statut DKIM/SPF/DMARC en temps réel |
| GET | `/admin/deliverability/incidents?window=&page=&page_size=` | `getAuthIncidents()` | Historique des incidents d'authentification paginé |
| POST | `/admin/deliverability/incidents/:id/acknowledge` | `acknowledgeIncident(id)` | Acquitter un incident résolu |
| POST | `/admin/deliverability/refresh` | `refreshAuthChecks()` | Déclencher un rafraîchissement manuel des vérifications |

## Modèle de réponse `AdminDeliverabilityDiagnosticsResponse`

```ts
interface AdminDeliverabilityDiagnosticsResponse {
  window: string;                       // Ex: "15m", "1h", "6h", "24h", "7d"
  spf?: { valid: boolean; record?: string };
  dkim?: { valid: boolean; domains?: string[] };
  dmarc?: { valid: boolean; record?: string };
  mx?: { records?: string[] };
  bounces?: { total: number; rate: number };
}
```

## Flux d'intégration

```
[Backend: /admin/deliverability/*]
    ↓ (HTTP)
[Frontend: email-auth-api.ts]
    ↓ (types)
[Composant: DeliverabilityOpsTab.tsx]
    ↓ (état)
[Utilisateur: dashboard de délivrabilité]
```

## Tests d'intégration

| Fichier | Tests | Coverage |
|---------|-------|----------|
| `email-auth-api.test.ts` | 12 | Construction URL, paramètres, pagination, encodage, contrats cross-repo |
| `cross-repo-deliverability.test.ts` | 6 | Mapping diagnostics → HeaderAnalysis, génération d'alertes, conformité |

## Dépendances cross-repo

- **Type partagé** : `AdminDeliverabilityDiagnosticsResponse` (dans `src/types/admin-ops-deliverability.ts`)
- **Backend impl** : `deliverability-monitor.ts` (PR #531 — commit `5e9a3dd`)
- **Frontend intégration** : `email-auth-api.ts` (PR #685)

## Conformité NIS2/DORA

Le résumé de conformité (`generateComplianceSummary`) vérifie que toutes les vérifications d'authentification sont au vert. En cas d'échec, des recommandations automatiques sont générées pour rétablir la conformité.
