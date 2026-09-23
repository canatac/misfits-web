Feature: Email composer undo send (MW-2026-003 / UX #778)
  As a user who just sent an email
  I want to undo the send within a 5-second window
  So that I can recover from accidental sends

  Background:
    Given the user is authenticated
    And the email composer is open
    And the user has composed an email to "recipient@example.com" with subject "Test"

  Scenario: Undo send within 5 seconds
    When I click "Send" on the composer
    Then a toast notification "Email sent — Undo" is visible
    And I click "Undo" within 5 seconds
    Then the email is moved back to drafts
    And the toast disappears
    And the composer shows the recovered email content

  Scenario: Undo window expires after 5 seconds
    When I click "Send" on the composer
    And I wait for 5 seconds
    Then the "Undo" button is no longer visible
    And the email appears in the Sent folder

  Scenario: Undo preserves email content
    Given I have typed "Important body content" in the composer body
    And I have added "attachment.pdf" as an attachment
    When I click "Send" on the composer
    And I click "Undo" within 5 seconds
    Then the draft contains "Important body content"
    And the draft still has "attachment.pdf" attached
    And the recipient field shows "recipient@example.com"

  Scenario: Undo send from keyboard shortcut
    When I click "Send" on the composer
    And I press "Ctrl+Z" within 5 seconds
    Then the email is moved back to drafts

  Scenario: No undo available for scheduled sends
    When I click "Scheduled send" and select a future date
    Then no "Undo" option is shown
    And a confirmation "Email scheduled" is displayed
