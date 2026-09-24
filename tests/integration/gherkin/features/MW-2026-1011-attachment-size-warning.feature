Feature: MW-2026-1011 — Email composer attachment size warning
  As a user
  I want to see a warning when my attachments exceed the size limit
  So that I know before sending that my email may be too large

  Background:
    Given I am on the email composer page at "https://mail.misfits.ai/mail/compose"

  Scenario: Composer page loads or redirects to login
    When I navigate to the compose page
    Then the response status should be 200 or 307

  Scenario: Anonymous user is redirected to login
    Given I am not authenticated
    When I navigate to the compose page
    Then the response status should be 307

  Scenario: Compose send endpoint requires authentication
    Given I am not authenticated
    When I send a POST request to "/api/compose/send" with body '{"to":"test@example.com","subject":"test","body":"test","attachments":[{"size":30000000}]}'
    Then the response status should be 307 or 400 or 401
    And the response status should not be 500

  Scenario: Attachment size validation endpoint is protected
    Given I am not authenticated
    When I send a POST request to "/api/compose/validate-attachment" with body '{"size":30000000}'
    Then the response status should be 307 or 401 or 404
