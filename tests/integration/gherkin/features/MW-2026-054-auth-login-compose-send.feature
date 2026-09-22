Feature: MW-2026-054 — Auth login + compose send endpoints must return valid HTTP status
  As a user
  I want the auth and compose API endpoints to be reachable
  So that I can log in and send emails without errors

  Background:
    Given the production server "https://mail.misfits.ai" is reachable

  Scenario: POST /api/auth/login does not return 502
    When I send a POST request to "/api/auth/login" with valid JSON body
    Then the response status code should not be 502
    And the response status code should be one of 200, 401, or 400

  Scenario: POST /api/compose/send does not return 502
    When I send a POST request to "/api/compose/send" with valid JSON body
    Then the response status code should not be 502
    And the response status code should be one of 200, 401, or 400

  Scenario: GET /api/admin/whoami does not return 500
    When I send a GET request to "/api/admin/whoami"
    Then the response status code should not be 500
    And the response status code should be one of 200, 307, or 401

  Scenario: Auth bypass regression still fixed — /api/emails unauthenticated
    When I send an unauthenticated GET request to "/api/emails"
    Then the response status code should be 307
    And no PII should be exposed in the response body

  Scenario: Auth bypass regression still fixed — /api/external-accounts unauthenticated
    When I send an unauthenticated GET request to "/api/external-accounts"
    Then the response status code should be 307
    And no PII should be exposed in the response body
