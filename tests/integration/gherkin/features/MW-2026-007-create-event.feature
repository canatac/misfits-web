Feature: MW-2026-007 — Create event from email
  As a user
  I want to create a calendar event from an email
  So that I can quickly schedule meetings or reminders

  Background:
    Given I am logged in as "qa.admin@misfits.fr"
    And I have an email with subject "Meeting next week"

  Scenario: Create event action available in email toolbar
    When I open the email with subject "Meeting next week"
    Then I should see a "Create event" or calendar icon in the email toolbar

  Scenario: Event creation opens calendar dialog
    Given I have an email open
    When I click "Create event"
    Then a calendar event dialog should appear
    And it should pre-fill the event title from the email subject

  Scenario: Event linked to source email
    Given I am in the calendar event dialog
    When I set the event date to tomorrow at 10:00
    And I confirm the event creation
    Then the event should be saved in the calendar
    And the event should contain a link back to the original email

  Scenario: Event appears in calendar view
    Given I created an event from an email
    When I navigate to the calendar page
    Then I should see the event on the scheduled date
    And clicking it should show the email reference
