Feature: MW-2026-113 — Email snooze presets
  As a user managing my inbox
  I want to snooze emails with quick preset durations
  So that I can temporarily hide emails and have them reappear when I'm ready to handle them

  Background:
    Given I am logged in as admin on "https://mail.misfits.ai"
    And I am on the inbox page "/mail"

  Scenario: Snooze dropdown is visible on email rows
    When the inbox loads
    Then a snooze button or icon should be visible on each email row

  Scenario: Snooze dropdown shows 4 presets + Custom option
    When I click the snooze button on an email
    Then a dropdown should appear with options "1h", "4h", "Tomorrow", "Next week", and "Custom"

  Scenario: Snoozing an email removes it from inbox
    When I click the snooze button on an email
    And I select the "1h" preset
    Then the email should disappear from the inbox list
    And a confirmation indicator should be visible

  Scenario: Snoozed email shows "Snoozed" badge
    When I snooze an email with the "4h" preset
    And I view the snoozed folder or the email detail
    Then a "Snoozed" badge should be visible on the email

  Scenario: Custom snooze option opens a date/time picker
    When I click the snooze button on an email
    And I select "Custom"
    Then a date and time picker should appear
    And I should be able to select a future date and time

  Scenario: Snooze API requires authentication
    Given I am not logged in
    When I send POST "/api/emails/test-id/snooze" with body '{"duration":"1h"}'
    Then the response should be 401 Unauthorized
    And no snooze action should be performed

  Scenario: Invalid snooze duration is rejected
    Given I am logged in as admin on "https://mail.misfits.ai"
    When I send POST "/api/emails/test-id/snooze" with body '{"duration":"invalid"}'
    Then the response should be 400 Bad Request

  Scenario: Snooze state persists across sessions
    When I snooze an email with the "Tomorrow" preset
    And I refresh the page
    Then the email should remain snoozed
    And the snooze indicator should still be visible
