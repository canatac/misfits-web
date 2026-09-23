Feature: UX-779 — Email snooze presets (one-click temporal removal)
  As a user who wants to temporarily remove an email from their inbox
  I want to snooze emails with preset durations (1h, 1d, 1w)
  So that I can focus on what matters now and revisit later

  Background:
    Given I am logged in as admin on "https://mail.misfits.ai"
    And I am on the inbox page

  Scenario: Snooze option available in email actions menu
    When I right-click or open the actions menu on an email
    Then I should see a "Snooze" option

  Scenario: Snooze presets visible (1h, 1d, 1w)
    When I click "Snooze" on an email
    Then I should see preset options: "1 hour", "1 day", "1 week"
    And I should see a "Custom" option for custom date/time

  Scenario: Snooze email for 1 hour
    When I snooze an email for "1 hour"
    Then the email should disappear from the inbox
    And a confirmation toast should appear: "Snoozed for 1 hour"

  Scenario: Snoozed emails appear in Snoozed folder
    When I snooze an email
    Then the email should be visible in a "Snoozed" folder or section

  Scenario: Snoozed email returns to inbox after duration
    Given an email was snoozed for "1 hour"
    When the snooze duration has elapsed
    Then the email should reappear in the inbox
    And it should be marked as "Snoozed" with a return indicator

  Scenario: Unsnooze an email before duration elapses
    Given an email is snoozed
    When I open the Snoozed folder
    And I click "Unsnooze" on the email
    Then the email should return to the inbox immediately

  Scenario: API endpoint /api/snooze exists and accepts POST
    When I send a POST request to "/api/snooze" with authentication
    Then the response should not be 404
    And the response should be one of 200, 400, or 401

  Scenario: Bulk snooze action available
    When I select multiple emails via checkboxes
    Then the floating action bar should include a "Snooze" action
