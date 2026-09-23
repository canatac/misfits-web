Feature: MW-2026-081 — Undo send with 5s window
  As a user who just sent an email
  I want to undo the send within a 5-second window
  So that I can recover from accidental sends or last-second changes

  Background:
    Given I am logged in as admin on "https://mail.misfits.ai"
    And I am on the inbox page "/mail"
    And the inbox contains at least 1 email

  Scenario: Undo send button appears after sending an email
    When I compose and send an email to "test@example.com"
    Then an "Undo" button should appear within 1 second
    And a countdown timer showing "5s" should be visible

  Scenario: Clicking Undo removes email from outbox and restores to drafts
    When I compose and send an email to "test@example.com"
    And I click "Undo" within 5 seconds
    Then the email should be removed from the sending queue
    And the email should appear in the Drafts folder
    And the composer should reopen with the original content

  Scenario: Undo window expires after 5 seconds
    When I compose and send an email to "test@example.com"
    And I wait for 6 seconds
    Then the "Undo" button should disappear
    And the email should appear in the Sent folder

  Scenario: Undo send is not available after window expires
    When I compose and send an email to "test@example.com"
    And I wait for 6 seconds
    Then no "Undo" option should be visible
    And the email cannot be recalled

  Scenario: Timer counts down from 5 to 0
    When I compose and send an email to "test@example.com"
    Then the timer should display "5s"
    When I wait 1 second
    Then the timer should display "4s"
    When I wait 1 second
    Then the timer should display "3s"

  Scenario: Multiple rapid sends each get their own undo window
    When I compose and send an email to "test1@example.com"
    And I compose and send an email to "test2@example.com"
    And I click "Undo" on the second email within 5 seconds
    Then only the second email should be in Drafts
    And the first email should be in Sent
