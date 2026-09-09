BATCH-33 rerun evidence (2026-09-07T16:35:42Z UTC)

Deployed probe (explicit command):
- `curl -sS -D tests/integration/gherkin/artifacts/batch-33/deployed-calendar.headers -o tests/integration/gherkin/artifacts/batch-33/deployed-calendar.body https://mail.misfits.ai/calendar`
- `curl -sS -D tests/integration/gherkin/artifacts/batch-33/deployed-calendar-events.headers -o tests/integration/gherkin/artifacts/batch-33/deployed-calendar-events.body https://mail.misfits.ai/api/calendar/events`

Results:
- `https://mail.misfits.ai/calendar` => `HTTP/2 200`
- `https://mail.misfits.ai/api/calendar/events` => `HTTP/2 500`

Local blocker reconfirmed:
- `http://localhost:3000/calendar` => `HTTP/1.1 500 Internal Server Error`
- `http://localhost:3000/api/calendar/events` => `HTTP/1.1 500 Internal Server Error`
- DOM probe: `roleTextboxRechercherUnPaysCount=0`, `roleTextboxRechercherUnPaysVisible=false`
- Screenshot: `tests/integration/gherkin/artifacts/batch-33/calendar-blockage-probe.png` (page shows only "Internal Server Error", no holidays input)

Attached artifacts:
- `tests/integration/gherkin/artifacts/batch-33/deployed-calendar.headers`
- `tests/integration/gherkin/artifacts/batch-33/deployed-calendar-events.headers`
- `tests/integration/gherkin/artifacts/batch-33/calendar.headers`
- `tests/integration/gherkin/artifacts/batch-33/calendar-events.headers`
- `tests/integration/gherkin/artifacts/batch-33/calendar-blockage-probe.json`
- `tests/integration/gherkin/artifacts/batch-33/calendar-blockage-probe.log`
