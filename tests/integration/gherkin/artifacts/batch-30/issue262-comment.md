BATCH-30 reconfirmation:

- Local probe command: `curl -sS -D tests/integration/gherkin/artifacts/batch-30/calendar-events.headers -o tests/integration/gherkin/artifacts/batch-30/calendar-events.body http://localhost:3000/api/calendar/events`
  - Result: `HTTP/1.1 500 Internal Server Error`
- Deployed probe command: `curl -sS -D tests/integration/gherkin/artifacts/batch-30/deployed-calendar-events.headers -o tests/integration/gherkin/artifacts/batch-30/deployed-calendar-events.body https://mail.misfits.ai/api/calendar/events`
  - Result: `HTTP/2 500`
- Downstream UI symptom persists:
  - `/calendar` body head is `Internal Server Error`
  - holidays textbox `Rechercher un pays` absent (`roleTextboxRechercherUnPaysCount=0`, `roleTextboxRechercherUnPaysVisible=false`)
  - screenshot: `tests/integration/gherkin/artifacts/batch-30/calendar-blockage-probe.png`

Artifacts: `tests/integration/gherkin/artifacts/batch-30/*`
