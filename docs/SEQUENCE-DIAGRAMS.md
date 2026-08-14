# SEQUENCE-DIAGRAMS — misfits-web

Diagrammes Mermaid ancrés sur les fichiers du repo. Chaque sequence référence le code réel.

## (a) Auth / session utilisateur

Sources: `src/app/login/page.tsx`, `src/hooks/use-auth.ts`, `src/stores/auth-store.ts`, `src/lib/api-client.ts`, `src/lib/session.ts`, `src/app/api/auth/callback/route.ts`, `src/middleware.ts`.

### Login email + password (+ 2FA optionnel)

```mermaid
sequenceDiagram
    autonumber
    participant U as Utilisateur
    participant UI as LoginPage<br/>(app/login/page.tsx)
    participant Store as auth-store<br/>(Zustand)
    participant API as api-client<br/>(lib/api-client.ts)
    participant Rewrite as Next rewrites<br/>(next.config.ts)
    participant Backend as email-api:8000
    participant Sess as session.ts<br/>(cookie + localStorage)

    U->>UI: Saisit email/password, Submit
    UI->>Store: useLogin().mutate(credentials)
    Store->>API: POST /api/auth/login
    API->>Rewrite: /api/auth/login
    Rewrite->>Backend: /api/auth/login
    alt 2FA requis
        Backend-->>API: 200 { two_factor_required: true, challenge_id }
        API-->>Store: TwoFactorRequiredResponse
        Store-->>UI: pendingTwoFactorChallengeId
        U->>UI: Code 6 chiffres
        UI->>Store: use2FA().mutate({ code, challengeId })
        Store->>API: POST /api/auth/2fa/verify
        API->>Backend: via rewrite
        Backend-->>API: 200 AuthApiResponse { session }
    else Succès direct
        Backend-->>API: 200 AuthApiResponse { session }
    end
    API->>Sess: storeSession(session, remember)
    Sess->>Sess: cookie mfa_session (mirror)<br/>+ localStorage mfa.session
    Store-->>UI: isAuthenticated=true
    UI->>UI: router.push(redirect || "/mail")
```

### Login OAuth GitHub (callback)

```mermaid
sequenceDiagram
    autonumber
    participant U as Utilisateur
    participant UI as LoginPage
    participant Backend as email-api
    participant CB as /api/auth/callback<br/>(route handler Next)
    participant Mid as middleware.ts

    U->>UI: Clic "Sign in with GitHub"
    UI->>Backend: initiateGithubLogin()<br/>(lib/api-client.ts)
    Backend->>U: 302 GitHub
    U->>Backend: Retour OAuth
    Backend->>CB: 302 /api/auth/callback?session=<b64>&provider=github
    CB->>CB: normalizeSession + Set-Cookie mfa_session (httpOnly)<br/>+ Set-Cookie mfa_oauth_pending
    CB->>U: 302 → redirectPath (défaut /dashboard)
    U->>Mid: GET /dashboard
    Mid->>Mid: cookie mfa_session présent → NextResponse.next()
    Mid-->>U: 200 dashboard
```

## (b) Chargement inbox

Sources: `src/app/mail/page.tsx`, `src/hooks/use-emails.ts`, `src/stores/email-store.ts`, `src/lib/mail-api.ts`, `next.config.ts`.

```mermaid
sequenceDiagram
    autonumber
    participant U as Utilisateur
    participant Page as /mail<br/>(app/mail/page.tsx)
    participant Hook as useEmails<br/>(TanStack Query)
    participant Store as email-store
    participant Fetch as fetch()
    participant Rewrite as Next rewrites
    participant Backend as email-api:8000
    participant DB as MongoDB

    U->>Page: Navigation /mail
    Page->>Hook: useEmails({folder, sortBy, filter, page, accountId})
    Hook->>Store: fetchEmails(query)
    Store->>Fetch: GET /api/emails?folder=inbox&...
    Note over Store,Fetch: Headers via mailAuthHeaders():<br/>x-user-id, x-user-email, Authorization
    Fetch->>Rewrite: same-origin /api/emails
    Rewrite->>Backend: ${BACKEND_URL}/api/emails
    Backend->>DB: query messages (user_id = local-part)
    DB-->>Backend: docs
    Backend-->>Fetch: 200 EmailListResponse<br/>{emails[], total, page, pageSize, hasMore}
    Fetch-->>Store: parse json
    Store-->>Hook: emails[]
    Hook-->>Page: render EmailList
```

## (c) Envoi d'un email via Compose

Sources: `src/app/compose/page.tsx`, `src/app/mail/page.tsx` (Modal), `src/stores/composer-store.ts`, `src/hooks/use-composer.ts`.

```mermaid
sequenceDiagram
    autonumber
    participant U as Utilisateur
    participant Comp as ComposerPanel<br/>(compose/page.tsx ou modal)
    participant Store as composer-store
    participant Fetch as fetch()
    participant Rewrite as Next rewrites
    participant Backend as email-api:8000
    participant SMTP as Rust SMTP relay

    U->>Comp: Rédige (Tiptap), pièces jointes, To/Cc/Bcc
    U->>Comp: Clic Send (ou Cmd+Enter)
    Comp->>Store: sendDraft(draftId, options)
    alt sendLater fourni
        Store->>Fetch: POST /api/send/schedule
    else Envoi immédiat
        Store->>Fetch: POST /api/send
    end
    Note over Store,Fetch: Body: { to[], cc?, bcc?, subject, bodyHtml, attachments[], priority, requestReadReceipt }
    Fetch->>Rewrite: /api/send
    Rewrite->>Backend: ${BACKEND_URL}/api/send
    Backend->>SMTP: relais SMTP (DKIM sign)
    SMTP-->>Backend: 250 OK
    Backend-->>Fetch: 200 { messageId, ... }
    Fetch-->>Store: mark sent, close composer
    opt Undo (fenêtre courte)
        U->>Comp: Cancel send
        Comp->>Store: undoSend(messageId)
        Store->>Fetch: POST /api/send/undo
        Fetch->>Backend: via rewrite
    end
```

## (d) Rafraîchissement PWA / service worker

Constat: aucun service worker n'est enregistré dans le repo à date (voir `public/` = `favicon.svg` uniquement; aucune référence `serviceWorker`/`workbox` dans `src`). Le refresh applicatif effectif est celui de Next lui-même (rechargement standard). Diagramme reflète l'état réel:

```mermaid
sequenceDiagram
    autonumber
    participant Browser
    participant Next as Next.js (standalone server)
    Note over Browser,Next: Pas de service worker versionné à date.<br/>Metadata PWA-friendly dans app/layout.tsx uniquement.
    Browser->>Next: GET / (navigation)
    Next-->>Browser: RSC / HTML
    Browser->>Next: GET /_next/static/* (fingerprinted)
    Next-->>Browser: 200 (immutable cache)
```

À implémenter: `public/manifest.json`, script d'enregistrement SW, stratégies de cache. À suivre dans un ticket séparé.

## (e) Espace Admin

Sources: `src/app/admin/*`, `src/app/api/admin/*/route.ts`, `src/lib/admin-ops-api.ts`, `src/app/api/admin/ai-activity/route.ts`.

### Change-requests (workflow deliverability)

```mermaid
sequenceDiagram
    autonumber
    participant Admin as Utilisateur admin
    participant Mid as middleware.ts
    participant Page as /admin/change-requests<br/>(app/admin/change-requests/page.tsx)
    participant Route as /api/admin/change-requests<br/>(route handler)
    participant Backend as email-api:8000

    Admin->>Mid: GET /admin/change-requests
    Mid->>Mid: /admin est protégé<br/>vérifie cookie mfa_session
    alt Non authentifié
        Mid-->>Admin: 302 /login?redirect=/admin/change-requests
    else Authentifié
        Mid-->>Admin: next()
        Admin->>Page: rendu
        Page->>Route: GET /api/admin/change-requests
        Route->>Backend: proxy → ${backendBase}/api/admin/change-requests<br/>(propage Authorization, x-user-id)
        Backend-->>Route: 200 ChangeRequestItem[]
        Route-->>Page: JSON
        Page-->>Admin: liste + workflow stages
        Admin->>Page: Créer/Update
        Page->>Route: POST/PATCH /api/admin/change-requests[/:id]
        Route->>Backend: proxy
        Backend-->>Route: 200
    end
```

### Changelog / AI activity (agrégation lecture seule)

```mermaid
sequenceDiagram
    autonumber
    participant Admin as Admin
    participant Page as /admin/changelog
    participant Log as /api/admin/changelog
    participant AI as /api/admin/ai-activity
    participant Backend as email-api

    Admin->>Page: GET /admin/changelog
    par Changelog
        Page->>Log: GET /api/admin/changelog
        Log->>Backend: GET /api/admin/change-requests
        Backend-->>Log: items[]
        Log-->>Page: entries[] (released/statuses)
    and AI activity
        Page->>AI: GET /api/admin/ai-activity
        AI->>Backend: GET /api/hermes/runs?limit=N
        Backend-->>AI: runs[]
        AI-->>Page: runs synthèse
    end
    Page-->>Admin: rendu combiné
```
