Feature: MW-2026-030 — CORS reflection + auth bypass (P0)
  As a security engineer
  I want the API to not reflect arbitrary Origins and require auth on all admin endpoints
  So that cross-origin attackers cannot read privileged responses

  Background:
    Given the misfits-mail application is running at "https://mail.misfits.ai"

  Scenario: API does not reflect arbitrary Origin header
    When I send a GET request to "/api/emails" with header "Origin: https://evil.com"
    Then the response header "Access-Control-Allow-Origin" should NOT be "https://evil.com"
    And the response header "Access-Control-Allow-Origin" should NOT be "*"

  Scenario: Admin endpoints require valid token even with spoofed Origin
    When I send a GET request to "/api/admin/ai-activity" with header "Origin: https://evil.com"
    Then the response status code should NOT be 200
    And the response should redirect to login or return 401

  Scenario: CORS preflight does not expose admin data
    When I send an OPTIONS request to "/api/admin/ai-activity" with header "Origin: https://evil.com"
    Then the response header "Access-Control-Allow-Origin" should NOT be "https://evil.com"
