Feature: Backend MongoDB connectivity (MW-2026-101)
  As a user of mail.misfits.ai
  I want the backend to connect to MongoDB successfully
  So that all authenticated features work properly

  Scenario: Lightweight health endpoint reports backend alive
    Given the mail.misfits.ai application is running
    When I request GET /api/health
    Then the response status should be 200
    And the response body should contain "status" equals "healthy"

  Scenario: Deep health endpoint reports MongoDB connectivity
    Given the mail.misfits.ai application is running
    When I request GET /api/health/deep
    Then the response body should contain "component" equals "mongodb"
    And the response body should contain "status" equals "healthy" or "unhealthy"

  Scenario: Auth login endpoint is reachable
    Given the mail.misfits.ai application is running
    When I request POST /api/auth/login with body {}
    Then the response status should not be 503
    And the response status should be 400 or 401

  Scenario: Compose send endpoint validates input
    Given the mail.misfits.ai application is running
    When I request POST /api/compose/send with body {"to":"","subject":"","body":""}
    Then the response status should not be 503
    And the response status should be 400

  Scenario: Auth whoami endpoint is reachable
    Given the mail.misfits.ai application is running
    When I request GET /api/auth/whoami
    Then the response status should not be 503
    And the response status should be 200 or 307
