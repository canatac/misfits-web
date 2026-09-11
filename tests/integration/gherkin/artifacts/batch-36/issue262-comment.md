BATCH-36 evidence update (UTC 2026-09-07T16:47:40Z)

Deployed probe (explicit):
- URL: https://mail.misfits.ai/calendar
- Command: `curl -sS -D tests/integration/gherkin/artifacts/batch-36/deployed-calendar.headers -o tests/integration/gherkin/artifacts/batch-36/deployed-calendar.body https://mail.misfits.ai/calendar`
- Status: `HTTP/2 200`

- URL: https://mail.misfits.ai/api/calendar/events
- Command: `curl -sS -D tests/integration/gherkin/artifacts/batch-36/deployed-calendar-events.headers -o tests/integration/gherkin/artifacts/batch-36/deployed-calendar-events.body https://mail.misfits.ai/api/calendar/events`
- Status: `HTTP/2 500`

Local blocker reconfirmed:
- `http://localhost:3000/calendar` => `HTTP/1.1 500 Internal Server Error`
- `http://localhost:3000/api/calendar/events` => `HTTP/1.1 500 Internal Server Error`
- Body head: `Internal Server Error`
- DOM probe: `roleTextboxRechercherUnPaysCount=0`, `searchInputCount=0`, `hasInternalServerErrorText=true`
- Screenshot: `tests/integration/gherkin/artifacts/batch-36/calendar-blockage-probe.png` (shows only "Internal Server Error")

Conclusion:
- Calendar holidays input absence remains a downstream symptom of server/API failure.
