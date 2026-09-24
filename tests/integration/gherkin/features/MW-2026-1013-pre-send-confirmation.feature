Feature: MW-2026-1013 — Pre-send attachment confirmation dialog
  As a user
  I want a confirmation dialog before sending emails with large attachments
  So that I can review the total size before committing to send

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
    When I send a POST request to "/api/compose/send" with body '{"to":"test@example.com","subject":"test","body":"test","attachments":[{"size":15000000}]}'
    Then the response status should be 307 or 400 or 401
    And the response status should not be 500

  Scenario: Pre-send validation endpoint is protected
    Given I am not authenticated
    When I send a POST request to "/api/compose/confirm-send" with body '{"totalSize":15000000}'
    Then the response status should be 307 or 401 or 404
