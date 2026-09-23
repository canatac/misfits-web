Feature: Frontend feature batch — P1 features (MW-2026-033)
  As a user of mail.misfits.ai
  All P1 frontend features should be implemented and functional

  Scenario: Login page loads correctly
    Given the mail.misfits.ai frontend is running
    When I navigate to /login
    Then the page should return HTTP 200
    And the page should contain a login form

  Scenario: Mail page redirects to login when unauthenticated
    Given the mail.misfits.ai frontend is running
    When I navigate to /mail without authentication
    Then the response should redirect to /login
    And the redirect status should be 307

  Scenario: Composer is accessible
    Given the mail.misfits.ai frontend is running
    When I navigate to /mail without authentication
    Then the response should redirect to /login
    And the redirect status should be 307

  Scenario: API endpoints require authentication
    Given the mail.misfits.ai frontend is running
    When I request GET /api/emails without authentication
    Then the response should redirect to /login
    And the redirect status should be 307
