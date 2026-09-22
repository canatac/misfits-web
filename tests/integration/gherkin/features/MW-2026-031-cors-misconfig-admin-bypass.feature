Feature: MW-2026-031 — CORS misconfig + admin bypass (P0)
  As a security engineer
  I want CORS properly configured and admin endpoints protected
  So that attackers cannot exploit CORS reflection to access admin APIs

  Background:
    Given the production server is configured at "mail.misfits.ai"

  Scenario: CORS does not reflect arbitrary Origin
    When I send a GET request to "https://mail.misfits.ai/api/emails" with header "Origin" = "https://evil.example.com"
    Then the response header "Access-Control-Allow-Origin" should NOT equal "https://evil.example.com"
    And the response header "Access-Control-Allow-Origin" should NOT equal "*"

  Scenario: CORS does not allow credentials from arbitrary origins
    When I send an OPTIONS request to "https://mail.misfits.ai/api/emails" with header "Origin" = "https://evil.example.com"
    Then the response header "Access-Control-Allow-Credentials" should NOT equal "true"

  Scenario: Admin endpoints require authentication
    When I send a GET request to "https://mail.misfits.ai/api/admin/users" without authentication
    Then the response status code should be 401

  Scenario: Admin endpoints require authentication for POST
    When I send a POST request to "https://mail.misfits.ai/api/admin/users" without authentication
    Then the response status code should be 401

  Scenario: Admin endpoints do not leak PII without auth
    When I send a GET request to "https://mail.misfits.ai/api/admin/users" without authentication
    Then the response body should not contain email addresses
    And the response body should not contain user names

  Scenario: CORS preflight from trusted origin works
    When I send an OPTIONS request to "https://mail.misfits.ai/api/emails" with header "Origin" = "https://mail.misfits.ai"
    Then the response status code should be 200 or 204
