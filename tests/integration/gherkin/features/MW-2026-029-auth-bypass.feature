Feature: MW-2026-029 — Auth bypass /api/emails + /api/hermes/runs + /api/admin
  As a security-conscious operator
  I want all sensitive API routes to require valid session authentication
  So that unauthenticated users cannot access inbox data, hermes runs, or admin endpoints

  Background:
    Given I am NOT logged in
    And the production endpoint is "https://mail.misfits.ai"

  Scenario: /api/emails requires authentication (P0)
    When I send GET "/api/emails" without a session cookie
    Then the response status should be 307 or 401
    And the response body should NOT contain inbox email data

  Scenario: /api/emails with path prefix requires authentication (P0)
    When I send GET "/api/emails/some-id" without a session cookie
    Then the response status should be 307 or 401
    And the response body should NOT contain email content

  Scenario: /api/hermes/runs requires authentication (P0)
    When I send GET "/api/hermes/runs" without a session cookie
    Then the response status should be 307 or 401
    And the response body should NOT contain hermes run data

  Scenario: /api/admin/ai-activity requires authentication (P0)
    When I send GET "/api/admin/ai-activity" without a session cookie
    Then the response status should be 307 or 401
    And the response body should NOT contain admin data

  Scenario: CORS origin is NOT reflected (P0)
    When I send GET "/api/emails" with header "Origin" = "https://evil.example.com"
    Then the response header "Access-Control-Allow-Origin" should NOT equal "https://evil.example.com"
    Or the response should be 307 or 401

  Scenario: /api/external-accounts requires authentication (P1)
    When I send GET "/api/external-accounts" without a session cookie
    Then the response status should be 307 or 401
    And the response body should NOT contain external account data
