# USAGE — misfits-web

Guide utilisateur ancré sur les routes Next.js réelles du repo. Chaque route pointe vers son fichier source.

## Authentification

- **Login**: `/login` — `src/app/login/page.tsx`. Flux 2 étapes: email + mot de passe (avec indicateur de force via `PasswordStrengthIndicator`), puis code 2FA 6 chiffres si le backend répond `two_factor_required`. Bouton "Se connecter avec GitHub" via `initiateGithubLogin()` (`src/lib/api-client.ts`).
- **Callback OAuth**: `/api/auth/callback` — `src/app/api/auth/callback/route.ts`. Reçoit `?session=<base64_json>&provider=...`, pose le cookie `mfa_session` (httpOnly) + un cookie `mfa_oauth_pending` court (lu par le store client), redirige vers `redirect` param, cookie `mfa_post_login_redirect`, ou `/dashboard`.
- **Reset password**: `/reset-password` — `src/app/reset-password/page.tsx`.
- **Register**: `/register` — `src/app/register/page.tsx`.
- **Middleware**: `src/middleware.ts` protège les préfixes `/mail`, `/compose`, `/settings`, `/dashboard`, `/admin`, `/monitoring`, `/security`. Sans cookie `mfa_session`, redirection vers `/login?redirect=<pathname>`. Routes publiques: `/`, `/login`, `/reset-password`, tous les `/api/*` (dont `/api/auth/callback`).

## Espace Mail (chat mail, séparé de l'admin)

- **Inbox / vue principale**: `/mail` — `src/app/mail/page.tsx` + `src/app/mail/layout.tsx`. Composition 3 colonnes responsive: `MailSidebar` + `EmailList` + `EmailView`/`ThreadView`. Intègre `ComposerPanel` (modal), `SearchOverlay`, `ChatPanel`, `TerminalConsole`, `VscodeLayoutControls`, `NovaMailIconRail`, `NovamailShellHeader`.
- **Compose (page pleine)**: `/compose` — `src/app/compose/page.tsx`. Supporte `?reply=<emailId>` et `?forward=<emailId>` pour préremplir depuis `getMockEmailById` / `useComposerStore`.
- **Contacts**: `/contacts` — `src/app/contacts/page.tsx`.
- **Calendar**: `/calendar` — `src/app/calendar/page.tsx`.
- **Newsletters**: `/newsletters` — `src/app/newsletters/page.tsx`.
- **Files**: `/files` — `src/app/files/page.tsx`.
- **Translation**: `/translation` — `src/app/translation/page.tsx`.
- **Docs (interne)**: `/docs` — `src/app/docs/page.tsx`.
- **Settings AI**: `/settings/ai` — `src/app/settings/ai/page.tsx`.

## Espace Admin (séparé du chat mail)

Structure sous `/admin`, layout dédié `src/app/admin/layout.tsx`.

- **Overview**: `/admin` — `src/app/admin/page.tsx` → `AdminConsolePage initialTab="overview"`.
- **Users**: `/admin/users` — `src/app/admin/users/page.tsx`.
- **Change requests (workflow deliverability/backlog)**: `/admin/change-requests` — `src/app/admin/change-requests/page.tsx`. Backed by `/api/admin/change-requests` (`src/app/api/admin/change-requests/route.ts`) et `/api/admin/change-requests/[id]` (`.../[id]/route.ts`).
- **Changelog**: `/admin/changelog` — `src/app/admin/changelog/page.tsx`. Backed by `/admin/changelog-feed` (`src/app/admin/changelog-feed/route.ts`) qui agrège les change-requests backend + commits/workflows GitHub.
- **Dashboard (Overview global)**: `/dashboard` — `src/app/dashboard/page.tsx` + `dashboard/layout.tsx`.
- **Security**: `/dashboard/security` — `src/app/dashboard/security/page.tsx`. Flux temps réel via `/api/security/live` (`src/app/api/security/live/route.ts`, hook `use-security-dashboard.ts`).
- **Monitoring**: `/dashboard/monitoring` — `src/app/dashboard/monitoring/page.tsx` + `/monitoring` (`src/app/monitoring/page.tsx`). Flux via `/api/monitoring/live` (`src/app/api/monitoring/live/route.ts`, hook `use-monitoring.ts`).

Le footer n'affiche pas de hash statique figé: les labels de build (`NEXT_PUBLIC_MISFITS_WEB_BUILD_VERSION`, `NEXT_PUBLIC_REIMAGINED_GUIDE_BUILD_VERSION`) sont injectés au deploy (`docker-compose.web.yml`, workflow `deploy` job) — short SHA web + backend.

## Raccourcis clavier

Source: `src/hooks/use-mail-shortcuts.ts`. Actifs uniquement hors input/textarea/contenteditable.

| Touche       | Action                                           |
| ------------ | ------------------------------------------------ |
| `j`          | Email suivant                                    |
| `k`          | Email précédent                                  |
| `e`          | Archiver                                         |
| `#`          | Supprimer                                        |
| `c`          | Composer                                         |
| `/`          | Focus recherche                                  |
| `Esc`        | Fermer overlay puis vue                          |
| `s`          | Toggle étoile                                    |
| `u`          | Marquer non-lu                                   |
| `Cmd/Ctrl+/` | Focus recherche (variante globale)               |
| `Cmd/Ctrl+B` | Toggle sidebar                                   |
| `Cmd/Ctrl+J` | Toggle chat panel                                |

## PWA / Service worker

Constat: `public/` ne contient que `favicon.svg`; aucun `manifest.json` ni `service-worker.js` versionné, aucune référence `serviceWorker`/`workbox` dans `src`. Le site est installable via les métadonnées standards Next (`src/app/layout.tsx` → `metadata`), mais **il n'y a pas de service worker offline actif à date**. La section PWA reste à implémenter (aucune preuve en code).

## Compte / multi-compte

Pas de route `/account` dédiée dans l'App Router. La gestion de compte est intégrée à l'admin (`/admin/users`, `AccountManagementPanel` selon composants) et au sélecteur de mailboxes (`src/components/mail/account-selector.tsx`, `add-account-modal.tsx`, `account-badge.tsx`), backé par `src/stores/account-store.ts` et `src/types/account.ts` (`EmailAccount`, `UnifiedInboxConfig`).

> Note fix récent (PR #88 `ed2820cc`): le default d'identité mailbox ne bascule plus automatiquement sur `admin` — l'utilisateur voit sa propre boîte tant qu'il n'en choisit pas une autre (`src/lib/mail-api.ts` → `getMailUserId` dérive le local-part de la session).
