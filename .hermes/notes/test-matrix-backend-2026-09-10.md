# Matrice de Tests — Backend API 2026-09-10

## POST /api/v1/drafts/schedule (Send Later)

| Input | Expected Result | Priority |
|-------|----------------|----------|
| Valid draft_id + future timestamp | 201 Created, returns schedule_id | P1 |
| Valid draft_id + past timestamp | 400 Bad Request, error: "timestamp must be in the future" | P1 |
| Invalid draft_id | 404 Not Found | P1 |
| Missing timestamp | 400 Bad Request, validation error | P1 |
| Scheduled send executes at timestamp | Email sent within 60s of scheduled time | P0 |

## GET /api/v1/drafts/scheduled

| Input | Expected Result | Priority |
|-------|----------------|----------|
| No scheduled sends | 200 OK, empty list | P1 |
| With scheduled sends | 200 OK, list with draft_id, scheduled_at, status | P1 |
| Filter by status | 200 OK, filtered results | P2 |

## DELETE /api/v1/drafts/scheduled/{id}

| Input | Expected Result | Priority|
|-------|----------------|----------|
| Valid schedule_id | 204 No Content, cancelled | P1 |
| Already executed schedule | 409 Conflict, error | P2 |
| Invalid schedule_id | 404 Not Found | P1 |

## POST /api/v1/import/configure (Import Wizard)

| Input | Expected Result | Priority |
|-------|----------------|----------|
| Gmail OAuth2 success | 200 OK, connected account, folder list | P1 |
| Outlook OAuth2 success | 200 OK, connected account, folder list | P1 |
| IMAP/SMTP generic config | 200 OK, auto-discovered settings | P1 |
| Invalid provider | 400 Bad Request, "unsupported provider" | P1 |
| OAuth2 failure | 401 Unauthorized, error details | P1 |
| IMAP connection failure | 400 Bad Request, "connection failed" | P1 |
| Provider alias (google→gmail) | 200 OK, normalized to gmail | P2 |

## Notes
- All endpoints require authentication (Bearer token)
- Rate limiting: 100 req/min for schedule, 30 req/min for import configure
- Send Later: timezone handling required (store as UTC)
- Import: credentials encrypted at rest (AES-256-GCM)
