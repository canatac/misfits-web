Feature: MW-2026-068 — Health endpoint for backend connectivity monitoring
  As an operator
  I want a /api/health endpoint that probes backend connectivity
  So that Docker can auto-restart the container when backend is unreachable

  Background:
    Given the misfits-web application is deployed to production

  Scenario: Health endpoint returns 200 when backend is reachable
    When I send GET request to "https://mail.misfits.ai/api/health"
    Then the response status code should be 200
    And the response body should contain backend health status

  Scenario: Health endpoint returns 503 when backend is unreachable
    Given the backend email-api is stopped or unreachable
    When I send GET request to "https://mail.misfits.ai/api/health"
    Then the response status code should be 503
    And the response should indicate backend unavailability

  Scenario: Health endpoint responds within 3 seconds
    When I send GET request to "https://mail.misfits.ai/api/health"
    Then the response should be received within 3000 milliseconds

  Scenario: Health endpoint is not authenticated
    When I send GET request to "https://mail.misfits.ai/api/health" without authentication
    Then the response status code should be 200 or 503
    And the endpoint should not require login
