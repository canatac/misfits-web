Feature: MW-2026-044 — Auth bypass regression test for /api/* routes
  As a security-conscious operator
  I want all /api/* routes to require authentication
  So that no PII is exposed via unauthenticated endpoints

  Background:
    Given the production server "https://mail.misfits.ai" is reachable

  Scenario: /api/emails returns 401 without session
    When I send an unauthenticated GET request to "/api/emails"
    Then the response status code should be 401
    And no PII should be exposed in the response body

  Scenario: /api/external-accounts returns 307 without session
    When I send an unauthenticated GET request to "/api/external-accounts"
    Then the response status code should be 307
    And no PII should be exposed in the response body

  Scenario: /api/hermes/runs returns 307 without session
    When I send an unauthenticated GET request to "/api/hermes/runs"
    Then the response status code should be 307
    And no PII should be exposed in the response body

  Scenario: /api/admin/ai-activity returns 307 without session
    When I send an unauthenticated GET request to "/api/admin/ai-activity"
    Then the response status code should be 307
    And no PII should be exposed in the response body

  Scenario: /api/admin/whoami returns 401 without session
    When I send an unauthenticated GET request to "/api/admin/whoami"
    Then the response status code should be 401
    And no PII should be exposed in the response body

  Scenario: CORS does not reflect arbitrary Origin on /api/emails
    When I send a GET request to "/api/emails" with header "Origin: https://evil.com"
    Then the response header "Access-Control-Allow-Origin" should not contain "evil.com"
