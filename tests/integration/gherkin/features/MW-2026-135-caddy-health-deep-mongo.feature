Feature: MW-2026-135 — Caddy health endpoint deep mongo check
  As an operator
  I want the Caddy liveness probe to be independent from MongoDB health
  So that a MongoDB outage does not cause a cascading failure of all /api/* routes

  Background:
    Given the production server is running at "https://mail.misfits.ai"

  Scenario: Lightweight liveness probe returns 200 even when MongoDB is slow
    When I send a GET request to "/api/health/live"
    Then the response status should be 200
    And the response body should contain "live"

  Scenario: Deep health check reports MongoDB status accurately
    When I send a GET request to "/api/health"
    Then the response status should be 200 or 503
    And the response body should contain "status"

  Scenario: Auth routes work during MongoDB outage (no cascading 502)
    Given the deep health check returns 503
    When I send a GET request to "/api/emails" without authentication
    Then the response status should be 307 or 401
    And the response status should not be 502

  Scenario: Admin auth gate works during MongoDB outage
    Given the deep health check returns 503
    When I send a GET request to "/api/admin/whoami" without authentication
    Then the response status should be 307 or 401
    And the response status should not be 502

  Scenario: Static routes work during MongoDB outage
    Given the deep health check returns 503
    When I send a GET request to "/login"
    Then the response status should be 200

  Scenario: Health live endpoint does not depend on MongoDB
    When I send a GET request to "/api/health/live"
    Then the response status should be 200
    And the response body should not contain "database"
    And the response body should not contain "ping_ms"
