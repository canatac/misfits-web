Feature: MW-2026-052 — API routes must not return HTTP 502
  As a testeur
  I want all /api routes to be reachable (not 502)
  So that the frontend can communicate with the backend

  Background:
    Given the production environment is "https://mail.misfits.ai"
    And the frontend is reachable (HTTP 200)

  Scenario: Health endpoint returns 200 or 503 (not 502)
    When I request GET /api/health
    Then the response status code should not be 502
    And the response time should be under 5 seconds

  Scenario: Auth login endpoint is reachable
    When I request POST /api/auth/login with valid credentials
    Then the response status code should not be 502
    And the response should be 200 or 401

  Scenario: AI summary endpoint is reachable
    When I request GET /api/ai/summary
    Then the response status code should not be 502

  Scenario: AI triage endpoint is reachable
    When I request GET /api/ai/triage
    Then the response status code should not be 502

  Scenario: AI replies endpoint is reachable
    When I request GET /api/ai/replies
    Then the response status code should not be 502

  Scenario: Newsletter subscription endpoint is reachable
    When I request GET /api/newsletters/subscriptions
    Then the response status code should not be 502

  Scenario: Threads endpoint is reachable
    When I request GET /api/threads
    Then the response status code should not be 502

  Scenario: Backend proxy is configured in Caddy
    Given the frontend returns HTTP 200
    When I request any /api route
    Then the response should not be 502 (backend unreachable)
