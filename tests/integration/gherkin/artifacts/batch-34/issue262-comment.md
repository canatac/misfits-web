## BATCH-34 evidence refresh (continuous fallback)

UTC: 2026-09-07T16:40:05Z

### Deployed probe (explicit)
Command:
```bash
curl -sS -D tests/integration/gherkin/artifacts/batch-34/deployed-calendar.headers -o tests/integration/gherkin/artifacts/batch-34/deployed-calendar.body https://mail.misfits.ai/calendar
curl -sS -D tests/integration/gherkin/artifacts/batch-34/deployed-calendar-events.headers -o tests/integration/gherkin/artifacts/batch-34/deployed-calendar-events.body https://mail.misfits.ai/api/calendar/events
```

Result:
- `https://mail.misfits.ai/calendar` => `HTTP/2 200`
- `https://mail.misfits.ai/api/calendar/events` => `HTTP/2 500`

### Local blockage reconfirmation
- `http://localhost:3000/calendar` => `HTTP/1.1 500 Internal Server Error`
- `http://localhost:3000/api/calendar/events` => `HTTP/1.1 500 Internal Server Error`
- Playwright DOM probe: `roleTextboxRechercherUnPaysCount=0`, `searchInputCount=0`, `hasInternalServerErrorText=true`
- Screenshot shows only `Internal Server Error` page; no holidays search input visible.

Artifacts:
- `tests/integration/gherkin/artifacts/batch-34/calendar-http-probe.log`
- `tests/integration/gherkin/artifacts/batch-34/calendar-blockage-probe.json`
- `tests/integration/gherkin/artifacts/batch-34/calendar-blockage-probe.png`
- `tests/integration/gherkin/artifacts/batch-34/misfits-calendar-repro.log`
- `tests/integration/gherkin/artifacts/batch-34/deployed-calendar-events.log`

Issue remains OPEN pending server/runtime fix for `/api/calendar/events` (deployed) and `/calendar` path locally.
