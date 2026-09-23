Feature: Newsletter Tracking Pixel Consent (MW-2026-066)
  As a user, I want consent gate for newsletter tracking pixels so my privacy is protected.

  Background:
    Given the mail.misfits.ai frontend is reachable
    And the backend API is operational

  Scenario: GET /api/newsletter/consent requires authentication
    When I send GET /api/newsletter/consent without a session token
    Then the response status should be 401
    And the response body should contain "AUTH_REQUIRED"

  Scenario: Newsletter consent API endpoint exists
    When I send GET /api/newsletter/consent without authentication
    Then the response status should NOT be 404

  Scenario: POST newsletter consent endpoint exists
    When I send POST /api/newsletter/consent with empty body and no auth
    Then the response status should NOT be 404

  Scenario: Newsletter consent feature is behind auth gate
    When I send unauthenticated GET /api/newsletter/consent
    Then the response status should be 401
    And no PII should be exposed in the response body
