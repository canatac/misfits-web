Feature: MW-2026-035 — Auth bypass /api/emails exposed (P0 regression)
  As a security engineer
  I want /api/emails to require valid authentication
  So that unauthenticated users cannot access inbox data

  Background:
    Given the misfits-mail application is running at "https://mail.misfits.ai"

  Scenario: Unauthenticated access to /api/emails returns 401
    When I send a GET request to "/api/emails" without authentication
    Then the response status code should be 401
    And the response body should NOT contain email addresses or subjects

  Scenario: Unauthenticated access to /api/hermes/runs returns 401
    When I send a GET request to "/api/hermes/runs" without authentication
    Then the response status code should be 401

  Scenario: Unauthenticated access to /api/admin/ai-activity returns 401
    When I send a GET request to "/api/admin/ai-activity" without authentication
    Then the response status code should be 401

  Scenario: Unauthenticated access to /api/admin/users returns 401
    When I send a GET request to "/api/admin/users" without authentication
    Then the response status code should be 401

  Scenario: /api/emails does not leak PII without auth
    When I send a GET request to "/api/emails" without authentication
    Then the response body should NOT contain "jan.atac"
    And the response body should NOT contain "@misfits.fr"
