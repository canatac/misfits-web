Feature: MW-2026-073 — Backend email-api 502 regression
  As a user
  I want the backend email-api to respond correctly on /api/compose/send
  So that I can send emails without encountering 502 backend_unavailable errors

  Background:
    Given the production environment is reachable at "https://mail.misfits.ai"
    And the MongoDB connection is healthy

  Scenario: Backend /api/compose/send responds with proper validation error
    When I send a POST request to "/api/compose/send" with empty body
    Then the response status code should be 200
    And the response body should contain a validation error message
    And the response should NOT be a 502 or 503 error

  Scenario: Backend /api/compose/send rejects missing recipient
    When I send a POST request to "/api/compose/send" with body '{"subject":"test"}'
    Then the response should indicate that recipient is required
    And the response status code should be 200

  Scenario: MongoDB health endpoint is operational
    When I send a GET request to "/api/monitoring/mongo-health"
    Then the response status code should be 200
    And the response body should contain '"status":"healthy"'

  Scenario: Frontend serves correctly alongside backend
    When I send a GET request to "/"
    Then the response status code should be 200
    And the backend API should be reachable

  Scenario: Auth bypass regression — /api/emails requires auth
    When I send an unauthenticated GET request to "/api/emails"
    Then the response status code should NOT be 200 with email data
    And the response status code should be 401 or 307

  Scenario: CORS does not reflect arbitrary Origin
    When I send a GET request to "/api/emails" with "Origin: https://evil.com"
    Then the response should NOT contain "Access-Control-Allow-Origin: https://evil.com"
