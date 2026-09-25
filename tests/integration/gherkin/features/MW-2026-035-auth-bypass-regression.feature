Feature: MW-2026-035 — Auth bypass /api/emails regression (post-fix verification)
  As a security-conscious user
  I want all protected API endpoints to require authentication
  So that no PII is exposed to unauthenticated requests

  Background:
    Given the application is running at "https://mail.misfits.ai"
    And I have no session cookie or auth token

  Scenario: /api/emails requires authentication
    When I send GET /api/emails without credentials
    Then the response status should be 401
    And the response body should not contain any email data

  Scenario: /api/external-accounts requires authentication
    When I send GET /api/external-accounts without credentials
    Then the response status should be 307 or 401
    And the response body should not contain account credentials

  Scenario: /api/admin requires authentication
    When I send GET /api/admin without credentials
    Then the response status should be 307 or 401
    And no admin data should be exposed

  Scenario: CORS headers do not reflect arbitrary Origin
    When I send GET /api/emails with Origin: https://evil.com
    Then the response should not contain "access-control-allow-origin: https://evil.com"
    And the response status should be 401

  Scenario: POST /api/emails requires authentication
    When I send POST /api/emails without credentials
    Then the response status should be 401 or 403
    And no email should be created

  Scenario: Path variants are also protected
    When I send GET /api/emails/123 without credentials
    Then the response status should be 401 or 307
    And no email content should be returned

  Scenario: /api/templates requires authentication (regression #1048)
    When I send GET /api/templates without credentials
    Then the response status should be 401
    And the response body should not contain any template data
    And the response should not be 500

  Scenario: /api/templates POST requires authentication
    When I send POST /api/templates without credentials
    Then the response status should be 401 or 403
    And no template should be created
