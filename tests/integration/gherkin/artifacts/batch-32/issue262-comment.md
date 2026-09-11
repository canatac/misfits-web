## BATCH-32 QA rerun evidence (2026-09-07T16:32:12Z)

Fresh deployed probe still failing on events API while `/calendar` page returns 200:

- Command: `curl -sS -D tests/integration/gherkin/artifacts/batch-32/deployed-calendar.headers -o tests/integration/gherkin/artifacts/batch-32/deployed-calendar.body https://mail.misfits.ai/calendar`
  - Status: `HTTP/2 200`
- Command: `curl -sS -D tests/integration/gherkin/artifacts/batch-32/deployed-calendar-events.headers -o tests/integration/gherkin/artifacts/batch-32/deployed-calendar-events.body https://mail.misfits.ai/api/calendar/events`
  - Status: `HTTP/2 500`

Local blocker remains:
- `/calendar` status: `HTTP/1.1 500 Internal Server Error`
- `/api/calendar/events` status: `HTTP/1.1 500 Internal Server Error`
- Playwright blockage probe: `roleTextboxRechercherUnPaysCount=0`, `visible=false`, `bodyTextHead="Internal Server Error"`
- Screenshot: `tests/integration/gherkin/artifacts/batch-32/calendar-blockage-probe.png`

Batch artifacts:
- `tests/integration/gherkin/artifacts/batch-32/misfits-uiux-vitest.log` (4 failing regressions)
- `tests/integration/gherkin/artifacts/batch-32/misfits-calendar-vitest.log` (Noël + month/day failures)
- `tests/integration/gherkin/artifacts/batch-32/misfits-calendar-repro.log` (holidays input absent)
- `tests/integration/gherkin/artifacts/batch-32/calendar-http-probe.log`
- `tests/integration/gherkin/artifacts/batch-32/calendar-blockage-probe.json`

Issue kept OPEN for deployed `/api/calendar/events` 500.
