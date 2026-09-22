Feature: MW-2026-002 — Scheduled send (send later)
  As a user
  I want to schedule an email to be sent at a future date/time
  So that I can compose now and send later

  Background:
    Given I am logged in as "qa.admin@misfits.fr"
    And I am on the compose page

  Scenario: Composer shows "Send Later" button
    Then I should see a "Send Later" or "Schedule" button in the composer footer

  Scenario: Schedule an email for future delivery
    When I compose an email to "test@example.com" with subject "Scheduled Test"
    And I click "Send Later"
    And I select a date 1 day in the future
    And I confirm the schedule
    Then I should see a confirmation "Email scheduled"
    And the email should appear in the "Scheduled" folder

  Scenario: Scheduled email is sent at the right time
    Given I have a scheduled email set to send in 1 minute
    When 1 minute passes
    Then the email should be in the "Sent" folder
    And it should have a "Scheduled" badge
