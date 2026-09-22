Feature: MW-2026-029-regression — Auth bypass regression tests for /api/* routes (issue #767)
  As a security-conscious operator
  I want automated regression tests ensuring all sensitive API routes require authentication
  So that future changes cannot reintroduce auth bypass vulnerabilities

  Background:
    Given the middleware is loaded
    And no session cookie is present

  Scenario: P0 regression — /api/emails redirects unauthenticated to login
    When the middleware processes GET "/api/emails"
    Then the response status should be 307
    And the Location header should contain "/login"

  Scenario: P0 regression — /api/emails/:id redirects unauthenticated to login
    When the middleware processes GET "/api/emails/some-uuid"
    Then the response status should be 307
    And the Location header should contain "/login"

  Scenario: P0 regression — /api/emails allows authenticated requests
    Given a valid "mfa_session" cookie is present
    When the middleware processes GET "/api/emails"
    Then the response status should be 200

  Scenario: P0 regression — /api/hermes/runs redirects unauthenticated to login
    When the middleware processes GET "/api/hermes/runs"
    Then the response status should be 307
    And the Location header should contain "/login"

  Scenario: P0 regression — /api/hermes/runs allows authenticated requests
    Given a valid "mfa_session" cookie is present
    When the middleware processes GET "/api/hermes/runs"
    Then the response status should be 200

  Scenario: P0 regression — /api/admin/ai-activity redirects unauthenticated to login
    When the middleware processes GET "/api/admin/ai-activity"
    Then the response status should be 307
    And the Location header should contain "/login"

  Scenario: P0 regression — /api/admin/admin users redirects unauthenticated to login
    When the middleware processes GET "/api/admin/users"
    Then the response status should be 307

  Scenario: P0 regression — /api/admin/whoami remains public
    When the middleware processes GET "/api/admin/whoami"
    Then the response status should be 200

  Scenario: P0 regression — /api/admin/login remains public
    When the middleware processes GET "/api/admin/login"
    Then the response status should be 200

  Scenario: P0 regression — CORS: cross-origin request from evil origin is blocked
    When the middleware processes GET "/api/emails" with header "Origin" = "https://evil.example.com"
    Then the response status should be 403

  Scenario: P0 regression — CORS: arbitrary origin is NOT reflected
    When the middleware processes GET "/api/emails" with header "Origin" = "https://evil.example.com"
    Then the "Access-Control-Allow-Origin" header should NOT equal "https://evil.example.com"

  Scenario: P1 regression — /api/external-accounts redirects unauthenticated to login
    When the middleware processes GET "/api/external-accounts"
    Then the response status should be 307

  Scenario: P1 regression — /api/external-accounts allows authenticated requests
    Given a valid "mfa_session" cookie is present
    When the middleware processes GET "/api/external-accounts"
    Then the response status should be 200

  Scenario: Public routes remain accessible
    When the middleware processes GET "/api/auth/login"
    Then the response status should be 200

  Scenario: Public routes remain accessible — health
    When the middleware processes GET "/api/health"
    Then the response status should be 200
