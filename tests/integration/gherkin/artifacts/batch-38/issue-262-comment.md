BATCH-38 rerun evidence (continuous fallback):

- UTC: 2026-09-07T16:55Z
- Local GET probe command:
  - `curl -sS -D tests/integration/gherkin/artifacts/batch-38/calendar.headers -o tests/integration/gherkin/artifacts/batch-38/calendar.body http://localhost:3000/calendar`
  - `curl -sS -D tests/integration/gherkin/artifacts/batch-38/calendar-events.headers -o tests/integration/gherkin/artifacts/batch-38/calendar-events.body http://localhost:3000/api/calendar/events`
- Local result:
  - `/calendar` => `HTTP/1.1 500 Internal Server Error`
  - `/api/calendar/events` => `HTTP/1.1 500 Internal Server Error`
- DOM+visual probe:
  - `node tests/integration/gherkin/calendar_blockage_probe_batch38.mjs`
  - textbox `Rechercher un pays`: count=0, visible=false
  - screenshot: `tests/integration/gherkin/artifacts/batch-38/calendar-blockage-probe.png` (shows only `Internal Server Error`)
- Deployed GET probe command:
  - `curl -sS -D tests/integration/gherkin/artifacts/batch-38/deployed-calendar.headers -o tests/integration/gherkin/artifacts/batch-38/deployed-calendar.body https://mail.misfits.ai/calendar`
  - `curl -sS -D tests/integration/gherkin/artifacts/batch-38/deployed-calendar-events.headers -o tests/integration/gherkin/artifacts/batch-38/deployed-calendar-events.body https://mail.misfits.ai/api/calendar/events`
- Deployed result:
  - `https://mail.misfits.ai/calendar` => `HTTP/2 200`
  - `https://mail.misfits.ai/api/calendar/events` => `HTTP/2 500`

Issue remains blocking for calendar holidays input visibility; selector absence is downstream symptom of 500 runtime failure.
