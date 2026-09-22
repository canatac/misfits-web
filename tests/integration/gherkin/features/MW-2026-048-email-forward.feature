Feature: MW-2026-048 — Email forward button with pre-filled composer
  As a user
  I want to forward an email to another recipient
  So that I can share relevant messages with colleagues

  Background:
    Given I am logged in as admin on "https://mail.misfits.ai"
    And I am on the inbox page "/mail"
    And at least one email is visible in the inbox

  Scenario: Forward button is visible in email toolbar
    When I open an email from the inbox
    Then the email toolbar should be visible
    And a "Forward" button should be present in the toolbar

  Scenario: Clicking Forward opens composer with pre-filled subject
    Given I have opened an email with subject "Original Subject"
    When I click the "Forward" button
    Then the email composer should open
    And the subject field should contain "Fwd: Original Subject"

  Scenario: Forwarded email contains original message body
    Given I have opened an email
    When I click the "Forward" button
    Then the composer body should contain "Forwarded message"
    And the composer body should contain the original sender address

  Scenario: Forward email can be sent to a recipient
    Given I have opened an email
    When I click the "Forward" button
    And I enter "recipient@example.com" in the "To" field
    And I click the send button
    Then a confirmation should appear
    And the email should appear in the Sent folder

  Scenario: Forward composer can be closed without sending
    Given I have opened an email
    When I click the "Forward" button
    And I close the composer
    Then the composer should be dismissed
    And no email should be sent
