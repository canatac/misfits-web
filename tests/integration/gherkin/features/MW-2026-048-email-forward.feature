Feature: MW-2026-048 — Email forward button with pre-filled composer
  As a user
  I want to forward an email to another recipient with the composer pre-filled
  So that I can quickly share an email without manually copying content

  Background:
    Given I am logged in as admin on "https://mail.misfits.ai"
    And I am on the inbox page "/mail"
    And at least one email is visible in the inbox

  Scenario: Forward button is visible on email view
    When I open an email from the inbox
    Then a "Forward" button should be visible in the email action bar

  Scenario: Clicking Forward opens composer with pre-filled subject
    Given I have opened an email with subject "Test Subject"
    When I click the "Forward" button
    Then the email composer should open
    And the subject field should contain "Fwd: Test Subject"

  Scenario: Clicking Forward opens composer with original body
    Given I have opened an email with body content
    When I click the "Forward" button
    Then the email composer should open
    And the body should contain the original email content

  Scenario: Forward composer has recipient field and send button
    Given I have opened an email
    When I click the "Forward" button
    Then the composer "To" field should be empty and focused
    And a "Send" button should be visible

  Scenario: Forward sends email to selected recipient
    Given I have opened an email
    When I click the "Forward" button
    And I enter "recipient@example.com" in the "To" field
    And I click "Send"
    Then a confirmation toast should appear
    And the composer should close
