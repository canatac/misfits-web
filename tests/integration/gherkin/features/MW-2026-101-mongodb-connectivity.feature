Feature: Backend MongoDB connectivity (MW-2026-101)
  As a user of mail.misfits.ai
  I want the backend to connect to MongoDB successfully
  So that all authenticated features work properly

  Scenario: Health endpoint reports MongoDB healthy
    Given the mail.misfits.ai application is running
    When I request GET /api/health
    Then the response status should be 200
    And the response body should contain "status" equals "healthy"
    And the response body should contain "ping_ms" less than 500

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
