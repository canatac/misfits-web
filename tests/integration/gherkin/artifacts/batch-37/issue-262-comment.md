BATCH-37 continuous fallback update.

Fresh deployed probe (GET, header-driven status):
- URL: `https://mail.misfits.ai/calendar`
- Command: `curl -sS -D tests/integration/gherkin/artifacts/batch-37/deployed-calendar.headers -o tests/integration/gherkin/artifacts/batch-37/deployed-calendar.body https://mail.misfits.ai/calendar`
- Result: `HTTP/2 200`

- URL: `https://mail.misfits.ai/api/calendar/events`
- Command: `curl -sS -D tests/integration/gherkin/artifacts/batch-37/deployed-calendar-events.headers -o tests/integration/gherkin/artifacts/batch-37/deployed-calendar-events.body https://mail.misfits.ai/api/calendar/events`
- Result: `HTTP/2 500`
- Body head: `{"error":"Failed to list events"}`

Fresh local blocker reconfirmed:
- `/calendar` -> `HTTP/1.1 500 Internal Server Error`
- `/api/calendar/events` -> `HTTP/1.1 500 Internal Server Error`
- Playwright DOM probe: `textbox[name="Rechercher un pays"]` count `0`, visible `false`
- Screenshot: `tests/integration/gherkin/artifacts/batch-37/calendar-blockage-probe.png` (only "Internal Server Error" visible)

Related artifacts:
- `tests/integration/gherkin/artifacts/batch-37/deployed-calendar-probe.log`
- `tests/integration/gherkin/artifacts/batch-37/calendar-http-probe.log`
- `tests/integration/gherkin/artifacts/batch-37/calendar-blockage-probe.log`
- `tests/integration/gherkin/artifacts/batch-37/calendar-blockage-probe.json`
