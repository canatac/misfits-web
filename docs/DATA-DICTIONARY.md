# DATA-DICTIONARY — misfits-web

Types TypeScript de la couche client + endpoints backend consommés. Chaque ligne cite son fichier source.

## Auth / Session

Source: `src/types/auth.ts`.

| Type / champ                    | Shape / valeurs                                                                | Source                    |
| ------------------------------- | ------------------------------------------------------------------------------ | ------------------------- |
| `UserRole`                      | `"user" \| "admin" \| "support"`                                              | `src/types/auth.ts`       |
| `User`                          | `{ id, email, displayName?, avatarUrl?, role, twoFactorEnabled, createdAt, updatedAt, lastLoginAt? }` | `src/types/auth.ts` |
| `Session`                       | `{ id, user: User, accessToken, refreshToken, expiresAt (ms), refreshExpiresAt (ms), issuedAt (ms), origin? }` | `src/types/auth.ts` |
| `LoginCredentials`              | `{ email, password, remember? }`                                               | `src/types/auth.ts`       |
| `RegisterCredentials`           | `{ first_name, last_name, password, condition_accepted }`                      | `src/types/auth.ts`       |
| `TwoFactorChallenge`            | `{ code, challengeId }`                                                        | `src/types/auth.ts`       |
| `AuthErrorCode`                 | `"invalid_credentials" \| "rate_limited" \| "two_factor_required" \| "network" \| "server" \| "unknown"` | `src/types/auth.ts` |
| `AuthApiResponse`               | `{ session: Session }`                                                         | `src/types/auth.ts`       |
| `TwoFactorRequiredResponse`     | `{ two_factor_required: true, challenge_id, ... }`                             | `src/types/auth.ts`       |
| Cookie `mfa_session`            | httpOnly, posé par le backend et par `/api/auth/callback`                      | `src/middleware.ts`, `src/app/api/auth/callback/route.ts` |
| localStorage `mfa.session`      | mirroir client `{ session, storedAt }`                                         | `src/lib/session.ts`      |
| localStorage `mfa.audit`        | ring buffer 50 entrées                                                         | `src/lib/session.ts`      |

## Email / Thread

Source: `src/types/email.ts`, `src/types/thread.ts`.

| Type / champ         | Shape                                                                                                            | Source                    |
| -------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------- |
| `Folder`             | `"inbox" \| "sent" \| "drafts" \| "archive" \| "trash" \| "spam"`                                              | `src/types/email.ts`      |
| `SortBy`             | `"date" \| "sender" \| "subject" \| "size" \| "unreadFirst"`                                                    | `src/types/email.ts`      |
| `FilterType`         | `"all" \| "unread" \| "starred" \| "attachments"`                                                               | `src/types/email.ts`      |
| `AttachmentType`     | `"pdf"\|"image"\|"doc"\|"spreadsheet"\|"presentation"\|"archive"\|"audio"\|"video"\|"other"`                | `src/types/email.ts`      |
| `EmailAddress`       | `{ name, address }`                                                                                              | `src/types/email.ts`      |
| `EmailAttachment`    | `{ id, filename, contentType, size, type, url?, downloadUrl?, previewUrl? }`                                     | `src/types/email.ts`      |
| `Email`              | `{ id, threadId, folder, from, to[], cc?, bcc?, replyTo?, subject, preview, body, bodyType: "html"\|"text", date, receivedAt, isRead, isStarred, isImportant, hasAttachments, attachments[], labels[], size, messageId, inReplyTo?, references?, headers?, accountId? }` | `src/types/email.ts` |
| `EmailListResponse`  | `{ emails: Email[], total, page, pageSize, hasMore }`                                                            | `src/types/email.ts`      |
| `EmailQuery`         | `{ folder?, sortBy?, filterType?, searchQuery?, page?, pageSize?, label?, accountId? }`                          | `src/types/email.ts`      |
| `ThreadingMode`      | `"bySubject" \| "byReferences" \| "byParticipants" \| "smart"`                                                  | `src/types/thread.ts`     |
| `Thread`             | `{ id, subject, messages: Email[], participants[], lastMessageDate, firstMessageDate, unreadCount, messageCount, hasAttachments, labels[], folder }` | `src/types/thread.ts` |

## Composer

Source: `src/types/composer.ts`.

| Type              | Shape                                                                                             |
| ----------------- | ------------------------------------------------------------------------------------------------- |
| `RecipientType`   | `"to" \| "cc" \| "bcc"`                                                                          |
| `Recipient`       | `{ id, name?, email, type, color? }`                                                              |
| `Attachment`      | `{ id, filename, contentType, size, previewUrl?, progress 0..100, status, error?, file? }`        |
| `Priority`        | `"normal" \| "high" \| "low"`                                                                    |
| `SendOptions`     | `{ sendLater? (ISO), priority?, requestReadReceipt? }`                                            |

## Multi-compte

Source: `src/types/account.ts`.

| Type                 | Shape                                                                                                 |
| -------------------- | ----------------------------------------------------------------------------------------------------- |
| `AccountProvider`    | `"gmail" \| "outlook" \| "proton" \| "custom" \| "misfits"`                                         |
| `AccountServerConfig`| `{ imapHost, imapPort, imapSecurity, smtpHost, smtpPort, smtpSecurity }` (`"none"\|"ssl"\|"starttls"`) |
| `EmailAccount`       | `{ id, email, name?, provider, color, avatar?, isDefault, aliases[], serverConfig?, connectedAt }`    |
| `UnifiedInboxConfig` | `{ enabled, accountIds[] }`                                                                           |

## Chat AI

Source: `src/types/chat.ts`.

| Type                 | Shape                                                                                                       |
| -------------------- | ----------------------------------------------------------------------------------------------------------- |
| `ChatMessage`        | `{ role: "user"\|"assistant"\|"system", content, timestamp?, metadata? }`                                 |
| `ChatMessageMetadata`| `{ trace?, confidence?: "high"\|"medium"\|"low", confidenceReason?, sources?: ChatSourceCitation[], latencyMs? }` |
| `ChatSourceCitation` | `{ label, value, kind?: "email"\|"thread"\|"folder"\|"attachment" }`                                    |
| `ChatConversation`   | `{ id, title, messages[], createdAt, updatedAt }`                                                           |
| `ChatContext`        | `{ currentEmailId?, currentFolder?, selectedEmails?, threadId?, userId?, sessionId?, sessionKey?, attachmentNames? }` |

## Admin Ops (change-requests / workflow)

Source: `src/types/admin-ops.ts`.

| Type                | Valeurs / shape                                                                                                              |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `WorkflowStatus`    | `"submitted" \| "triaged" \| "planned" \| "in_progress" \| "qa" \| "released" \| "rejected"`                             |
| `WorkflowPriority`  | `"P0" \| "P1" \| "P2"`                                                                                                     |
| `ExecutionState`    | `"idle" \| "queued" \| "running" \| "failed" \| "success"`                                                                |
| `WorkflowStage`     | `{ key, label, owner: "product"\|"backend"\|"frontend"\|"qa"\|"ops", status: "pending"\|"active"\|"done", checklist[], doneAt? }` |
| `ChangeRequestItem` | `{ id, title, problem, desiredOutcome, scope, priority, status, requestedBy, linkedRepo, createdAt, updatedAt, takenInChargeAt?, takenInChargeBy?, targetReleaseWindow, acceptanceCriteria[], workflow: WorkflowStage[], workflowEvents[] }` |

Autres domaines typés (à consulter au besoin): `src/types/{ai,ai-triage,ai-settings,calendar,contact,follow-up,label,monitoring,search,security}.ts`.

## Endpoints backend consommés

Toutes les requêtes navigateur vont vers l'origine (`/api/*`) et sont soit servies par un route handler Next (proxy typé), soit rewrittées vers `${BACKEND_URL}/api/:path*` (`next.config.ts`).

| Méthode | Route (browser)                                | Consommateur                              | Cible backend                                              | Source                                                                 |
| ------- | ---------------------------------------------- | ----------------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------- |
| GET     | `/api/emails?...`                              | `useEmails` / `email-store`               | rewrite → `${BACKEND_URL}/api/emails`                      | `src/hooks/use-emails.ts`, `src/stores/email-store.ts`, `next.config.ts` |
| GET     | `/api/emails/{id}`                             | `useEmails`                               | rewrite → `${BACKEND_URL}/api/emails/{id}`                 | `src/hooks/use-emails.ts`                                              |
| POST    | `/api/emails/{id}/action`                      | `useEmails` (read/star/archive/delete/…)  | rewrite → backend                                          | `src/hooks/use-emails.ts`                                              |
| POST    | `/api/send`                                    | `composer-store`, `use-composer`          | rewrite → `${BACKEND_URL}/api/send`                        | `src/stores/composer-store.ts`, `src/hooks/use-composer.ts`            |
| POST    | `/api/send/schedule`                           | `composer-store`, `use-composer`          | rewrite → backend                                          | `src/stores/composer-store.ts`, `src/hooks/use-composer.ts`            |
| POST    | `/api/send/undo`                               | `use-composer`                            | rewrite → backend                                          | `src/hooks/use-composer.ts`                                            |
| POST/GET| `/api/drafts`                                  | `use-composer`                            | rewrite → backend                                          | `src/hooks/use-composer.ts`                                            |
| GET     | `/api/templates`                               | `use-composer`                            | rewrite → backend                                          | `src/hooks/use-composer.ts`                                            |
| GET/PUT | `/api/settings/ai`                             | `ai-settings` client                      | rewrite → backend                                          | `src/lib/ai-settings.ts`                                               |
| POST    | `/api/ai` (SSE)                                | `ai-client`                               | Route handler serveur → OpenRouter (clé serveur uniquement)| `src/app/api/ai/route.ts`, `src/lib/ai-client.ts`                       |
| POST    | `/api/hermes/chat`                             | `chat-store`                              | Route handler → `${backendBase}/api/hermes/chat`           | `src/app/api/hermes/chat/route.ts`, `src/stores/chat-store.ts`         |
| GET/POST| `/api/hermes/runs`                             | `chat-store`                              | Route handler → `${backendBase}/api/hermes/runs?limit=N`   | `src/app/api/hermes/runs/route.ts`                                     |
| GET     | `/api/hermes/runs/{runId}`                     | client                                    | Route handler → `${backendBase}/api/hermes/runs/{runId}`   | `src/app/api/hermes/runs/[runId]/route.ts`                             |
| GET (SSE)| `/api/hermes/runs/{runId}/events?stream=true` | `chat-store`                              | Route handler → backend SSE                                | `src/app/api/hermes/runs/[runId]/events/route.ts`                      |
| GET (SSE)| `/api/security/live`                          | `use-security-dashboard`                  | Route handler → `${backend}/api/security/live`             | `src/app/api/security/live/route.ts`                                   |
| GET (SSE)| `/api/monitoring/live`                        | `use-monitoring`                          | Route handler → `${monitoring}/api/monitoring/live`        | `src/app/api/monitoring/live/route.ts`                                 |
| GET/POST/PATCH/DELETE | `/api/admin/users` / `/api/admin/users/{id}` | admin console       | Route handler proxy → `${backend}/api/admin/users…`        | `src/app/api/admin/users/route.ts`                                     |
| GET/POST/PATCH/DELETE | `/api/admin/change-requests` / `/{id}`     | admin console       | Route handler proxy → backend                              | `src/app/api/admin/change-requests/route.ts`, `.../[id]/route.ts`      |
| GET     | `/admin/changelog-feed`                        | admin changelog page                      | Route handler agrégateur: `${backend}/api/admin/change-requests` + GitHub commits/runs | `src/app/admin/changelog-feed/route.ts`                    |
| GET/POST| `/api/admin/deliverability/procedure?window=…` | admin deliverability                      | Route handler proxy → backend                              | `src/app/api/admin/deliverability/procedure/route.ts`                  |
| GET     | `/api/admin/ai-activity`                       | admin activity                            | Route handler → `${backend}/api/hermes/runs?limit=N`       | `src/app/api/admin/ai-activity/route.ts`                               |
| GET     | `/api/auth/callback?session=…&provider=…`      | OAuth backend redirect                    | Handler local (pas d'appel sortant)                        | `src/app/api/auth/callback/route.ts`                                   |

### Headers d'authentification vers l'API mail

Source: `src/lib/mail-api.ts` (`mailAuthHeaders`).

| Header             | Valeur                                                         |
| ------------------ | -------------------------------------------------------------- |
| `Content-Type`     | `application/json`                                             |
| `x-user-id`        | local-part de l'email session (`getMailUserId`)                |
| `x-user-email`     | email complet de la session                                    |
| `Authorization`    | `Bearer <accessToken>` si présent (`getAccessToken`)           |

### Résolution `BACKEND_URL`

- Client (browser): rewrites Next configurées au build (`next.config.ts`), base `/api` (`src/lib/api-client.ts`).
- Route handlers serveur: `resolveBackendBaseUrl()` — variable env `BACKEND_URL`, défaut prod `http://email-api:8000`, défaut dev `http://localhost:8000`.
