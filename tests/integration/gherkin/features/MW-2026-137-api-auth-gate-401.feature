Feature: MW-2026-137 — API auth gate returns 401 for unauthenticated requests
  As an API client
  I want protected /api/* routes to return HTTP 401 (not 307 redirect)
  So that programmatic clients can distinguish auth failure from redirect

  Background:
    Given I am not authenticated
    And the API base URL is "https://mail.misfits.ai"

  Scenario: GET /api/emails returns 401 when unauthenticated
    When I send a GET request to "/api/emails"
    Then the response status should be 401
    And the response body should contain "Unauthorized"
    And the response should not redirect to "/login"

  Scenario: GET /api/hermes/runs returns 401 when unauthenticated
    When I send a GET request to "/api/hermes/runs"
    Then the response status should be 401
    And the response body should contain "Unauthorized"

  Scenario: GET /api/external-accounts returns 401 when unauthenticated
    When I send a GET request to "/api/external-accounts"
    Then the response status should be 401
    And the response body should contain "Unauthorized"

  Scenario: GET /api/admin/users returns 401 when unauthenticated
    When I send a GET request to "/api/admin/users"
    Then the response status should be 401
    And the response body should contain "Unauthorized"

  Scenario: GET /api/templates returns 401 when unauthenticated
    When I send a GET request to "/api/templates"
    Then the response status should be 401
    And the response body should contain "Unauthorized"

  Scenario: GET /api/admin/whoami returns 401 when unauthenticated (reference: already correct)
    When I send a GET request to "/api/admin/whoami"
    Then the response status should be 401
    And the response body should contain "Unauthorized"

  Scenario: POST /api/compose/send returns 401 when unauthenticated
    When I send a POST request to "/api/compose/send" with body '{"to":[],"subject":"","body":""}'
    Then the response status should be 401
    And the response should not redirect to "/login"

  Scenario: API response Content-Type is application/json
    When I send a GET request to "/api/emails"
    Then the response status should be 401
    And the response Content-Type should contain "application/json"

  Scenario: No Location header in API 401 responses
    When I send a GET request to "/api/emails"
    Then the response status should be 401
    And the response should not contain a "Location" header

  Scenario: UI routes still redirect to login (307 preserved for non-API)
    When I send a GET request to "/mail/compose"
    Then the response status should be 307
    And the response Location header should contain "/login"
