Feature: Email Read Receipts (MW-2026-065)
  As a user, I want to request and receive read receipts so I know when my emails are read.

  Background:
    Given the mail.misfits.ai frontend is reachable
    And the backend API is operational

  Scenario: GET /api/emails/snooze requires authentication
    When I send GET /api/emails/snooze without a session token
    Then the response status should be 401
    And the response body should contain "AUTH_REQUIRED"

  Scenario: GET /api/emails/receipts requires authentication
    When I send GET /api/emails/receipts without a session token
    Then the response status should be 401
    And the response body should contain "AUTH_REQUIRED"

  Scenario: Read receipts API endpoint exists
    When I send GET /api/emails/receipts without authentication
    Then the response status should NOT be 404

  Scenario: POST read receipts endpoint exists
    When I send POST /api/emails/receipts with empty body and no auth
    Then the response status should NOT be 404

  Scenario: Read receipts feature is behind auth gate
    When I send unauthenticated GET /api/emails/receipts
    Then the response status should be 401
    And no PII should be exposed in the response body
