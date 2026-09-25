Feature: MW-2026-1048 — /api/templates 500 regression (smoke test)
  As a testeur
  I want /api/templates to return 401 for unauthenticated requests (never 500)
  So that auth is enforced and backend errors don't leak to clients

  Background:
    Given the application is running at "https://mail.misfits.ai"
    And I have no session cookie or auth token

  Scenario: GET /api/templates returns 401 (not 500) when unauthenticated
    When I send GET /api/templates without credentials
    Then the response status should be 401
    And the response should not be 500

  Scenario: GET /api/templates returns 401 even when backend is unhealthy
    Given the backend MongoDB may be unhealthy
    When I send GET /api/templates without credentials
    Then the response status should be 401
    And no internal error details should be exposed

  Scenario: GET /api/templates with invalid token returns 401
    When I send GET /api/templates with Authorization: Bearer invalid_token
    Then the response status should be 401
    And the response should not be 500

  Scenario: POST /api/templates returns 401 or 403 when unauthenticated
    When I send POST /api/templates without credentials
    Then the response status should be 401 or 403
    And no template should be created

  Scenario: /api/templates/{id} returns 401 or 404 when unauthenticated
    When I send GET /api/templates/some-id without credentials
    Then the response status should be 401 or 404
    And the response should not be 500
