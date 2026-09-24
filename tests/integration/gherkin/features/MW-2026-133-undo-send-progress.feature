Feature: MW-2026-133 — Email composer undo send with progress bar
  As a user who just sent an email
  I want to undo the send within a time window with a visible countdown
  So that I can recover from accidental sends

  Background:
    Given I am logged in as admin on "https://mail.misfits.ai"
    And I open the email composer
    And I have composed a valid email

  Scenario: Undo send appears after sending
    When I click "Send"
    Then an "Undo send" button with a 5-second progress bar should appear

  Scenario: Progress bar counts down
    When I click "Send"
    Then the progress bar should visibly deplete over 5 seconds

  Scenario: Clicking Undo recovers the email
    When I click "Send"
    And I click "Undo send" within 5 seconds
    Then the email should be moved back to drafts
    And the email should not be sent

  Scenario: Undo window expires
    When I click "Send"
    And I wait more than 5 seconds
    Then the "Undo send" button should disappear
    And the email should be in the Sent folder

  Scenario: Security — undo requires authentication
    Given I am not logged in
    When I attempt to access undo send endpoints
    Then I should be redirected to "/login"
