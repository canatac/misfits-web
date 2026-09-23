Feature: MW-2026-068 — Health endpoint for Docker probe and backend connectivity
  As a DevOps operator
  I want a /api/health endpoint that reports backend connectivity
  So that Docker healthcheck can verify backend and auto-restart on failure

  Background:
    Given the production server "https://mail.misfits.ai" is reachable

  Scenario: GET /api/health returns 200 when backend is healthy
    When I send a GET request to "/api/health"
    Then the response status code should be 200
    And the response body should contain a status field

  Scenario: GET /api/health does not return 404
    When I send a GET request to "/api/health"
    Then the response status code should not be 404
    And the response status code should not be 502

  Scenario: GET /api/monitoring/mongo-health returns backend status
    When I send a GET request to "/api/monitoring/mongo-health"
    Then the response status code should be 200
    And the response body should contain "healthy"

  Scenario: Health endpoint is not proxied to backend
    When I send a GET request to "/api/health"
    Then the response status code should be one of 200 or 503
    And the response should be served by Next.js not the backend
