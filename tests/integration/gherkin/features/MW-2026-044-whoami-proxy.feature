Feature: MW-2026-044 — /api/admin/whoami proxy regression
  As a security-conscious operator
  I want /api/admin/whoami to return 307 (auth gate) instead of 500 (server error)
  So that the admin console can determine user role/CRUB affordances

  Background:
    Given I am NOT logged in
    And the production endpoint is "https://mail.misfits.ai"

  Scenario: /api/admin/whoami returns 307 without session (regression)
    When I send GET "/api/admin/whoami" without a session cookie
    Then the response status should be 307 or 401
    And the response status should NOT be 500

  Scenario: /api/admin/whoami does not expose backend error details
    When I send GET "/api/admin/whoami" without a session cookie
    Then the response body should NOT contain "Internal Server Error"
    And the response body should NOT contain stack trace data

  Scenario: All /api/admin/* endpoints behave consistently
    When I send GET "/api/admin/whoami" without a session cookie
    Then the response status should match the status of GET "/api/admin/ai-activity"
