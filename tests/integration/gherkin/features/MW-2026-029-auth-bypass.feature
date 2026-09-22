Feature: MW-2026-029 — Auth bypass (P0) — Inbox & attachments protected
  As a security engineer
  I want all mail and admin endpoints to require valid authentication
  So that unauthenticated users cannot access inbox data or download attachments

  Background:
    Given the misfits-mail application is running at "https://mail.misfits.ai"

  Scenario: Unauthenticated access to inbox is rejected
    When I send a GET request to "/api/mail/inbox" without authentication
    Then the response status code should be 401
    And the response body should contain "AUTH_REQUIRED"

  Scenario: Unauthenticated access to attachments is rejected
    When I send a GET request to "/api/emails/{email_id}/attachments/{att_id}" without authentication
    Then the response status code should be 401
    And the response body should NOT contain binary file content

  Scenario: Unauthenticated access to admin endpoints is rejected
    When I send a GET request to "/api/admin/users" without authentication
    Then the response status code should be 401
    And the response body should contain "AUTH_REQUIRED"

  Scenario: Unauthenticated access to admin stats is rejected
    When I send a GET request to "/api/admin/stats" without authentication
    Then the response status code should be 401

  Scenario: Attachment endpoint does not serve files without auth
    Given an email with ID "07547fb5-cec4-af4a-277d-3b22cdf83d73@misfits.ai" exists
    And it has an attachment with ID "att-0"
    When I send a GET request to "/api/emails/07547fb5-cec4-af4a-277d-3b22cdf83d73@misfits.ai/attachments/att-0" without authentication
    Then the response status code should be 401
    And the response Content-Type should NOT be "application/pdf"
