## BATCH-31 QA rerun evidence (2026-09-07T16:29:32Z)

Fresh rerun confirms blocker is still active.

### Local probes (misfits-web)
- `http://localhost:3000/calendar` => `HTTP/1.1 500 Internal Server Error`
- `http://localhost:3000/api/calendar/events` => `HTTP/1.1 500 Internal Server Error`
- Browser/DOM probe: `roleTextboxRechercherUnPaysCount=0`, `searchInputCount=0`, `bodyTextHead=Internal Server Error`
- Screenshot: `tests/integration/gherkin/artifacts/batch-31/calendar-blockage-probe.png` (only "Internal Server Error", no holidays input)

### Deployed probe
- URL: `https://mail.misfits.ai/calendar` => `HTTP/2 200`
- URL: `https://mail.misfits.ai/api/calendar/events` => `HTTP/2 500`

### Logs/artifacts
- `tests/integration/gherkin/artifacts/batch-31/misfits-uiux-vitest.log` (4 failing scenarios)
- `tests/integration/gherkin/artifacts/batch-31/misfits-calendar-vitest.log` (Noël + month/day failures)
- `tests/integration/gherkin/artifacts/batch-31/misfits-calendar-repro.log` (holiday input missing)
- `tests/integration/gherkin/artifacts/batch-31/misfits-batch31-summary.json`

Issue remains OPEN pending backend/runtime fix for `/api/calendar/events` 500.
