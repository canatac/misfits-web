Feature: MW-2026-088 — Compose send must not return 502 backend_unreachable
  As a user
  I want /api/compose/send to reach the backend
  So that I can compose and send emails without 502 errors

  Background:
    Given the production server "https://mail.misfits.ai" is reachable

  Scenario: POST /api/compose/send does not return 502
    When I send a POST request to "/api/compose/send" with valid JSON body
    Then the response status code should not be 502
    And the response body should not contain "backend_unreachable"
    And the response status code should be one of 200, 401, or 400

  Scenario: GET /api/health reports backend connectivity
    When I send a GET request to "/api/health"
    Then the response status code should not be 503
    And the response body should not contain "unhealthy"

  Scenario: POST /api/compose/send with empty body returns 400 not 502
    When I send a POST request to "/api/compose/send" with empty JSON body
    Then the response status code should not be 502
    And the response status code should be one of 200, 401, or 400
