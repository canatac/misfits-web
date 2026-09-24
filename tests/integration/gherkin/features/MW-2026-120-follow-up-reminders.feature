Feature: MW-2026-120 — Email follow-up reminders: badge + notification + snooze
  As a user managing my emails
  I want to set follow-up reminders on emails
  So that I never forget to follow up on important conversations

  Background:
    Given I am logged in as admin on "https://mail.misfits.ai"
    And I am on the inbox page "/mail"

  Scenario: Follow-up button is visible in email list
    When the inbox loads
    Then each email row should have a "Follow-up" button or icon

  Scenario: Follow-up button is visible in email detail view
    When I open an email
    Then a "Follow-up" button should be visible in the email detail toolbar

  Scenario: Setting a follow-up reminder with presets
    When I click the "Follow-up" button on an email
    Then a dropdown should appear with preset options: "1h", "4h", "Tomorrow", "Next week"
    And a "Custom" option should be available with a datetime picker

  Scenario: Follow-up badge appears on email after setting reminder
    When I set a follow-up reminder for "Tomorrow" on an email
    Then a "Follow-up" badge should appear on the email row in the inbox

  Scenario: Email is marked with follow-up label
    When I set a follow-up reminder on an email
    Then the email should be marked with a "suivi" label in the system

  Scenario: Snooze option on active follow-up reminder
    When an email has an active follow-up reminder
    And I click the snooze option
    Then I should be able to postpone the reminder by "1h", "4h", or "Tomorrow"

  Scenario: Browser notification at reminder time
    When a follow-up reminder time is reached
    And browser notifications are permitted
    Then a browser notification should be displayed for the follow-up

  Scenario: Follow-up reminder persists after page reload
    When I set a follow-up reminder on an email
    And I refresh the page
    Then the follow-up badge should still be visible on the email

  Scenario: Follow-up requires authentication
    Given I am not logged in
    When I attempt to set a follow-up reminder
    Then I should be redirected to "/login"
    And no reminder should be set
