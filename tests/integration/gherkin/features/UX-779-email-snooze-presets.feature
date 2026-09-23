Feature: UX-779 — Email snooze presets with one-click temporal removal
  As a user managing my inbox
    I want to snooze emails with preset durations (1h, 1d, 1w)
    So that I can temporarily remove emails from my inbox and have them return at the right time

  Background:
    Given I am logged in as admin on "https://mail.misfits.ai"
    And I am on the inbox page "/mail"
    And the inbox contains at least 1 email

  Scenario: Snooze button is visible on each email
    When I view an email in the inbox list
    Then a snooze icon/button should be visible (clock or bell icon)
    When I click the snooze button
    Then a snooze presets dropdown should appear with options: "1 heure", "1 jour", "1 semaine"

  Scenario: Snooze for 1 hour removes email from inbox
    When I click the snooze button on an email
    And I select "1 heure" from the presets
    Then the email should disappear from the inbox
    And a confirmation toast should appear: "Email reporté dans 1 heure"

  Scenario: Snooze for 1 day removes email from inbox
    When I click the snooze button on an email
    And I select "1 jour" from the presets
    Then the email should disappear from the inbox
    And a confirmation toast should appear: "Email reporté dans 1 jour"

  Scenario: Snooze for 1 week removes email from inbox
    When I click the snooze button on an email
    And I select "1 semaine" from the presets
    Then the email should disappear from the inbox
    And a confirmation toast should appear: "Email reporté dans 1 semaine"

  Scenario: Snoozed emails appear in a dedicated "Snoozed" section
    When I snooze an email
    Then a "Snoozed" section/folder should be visible in the sidebar
    And clicking it should show all snoozed emails with their return time

  Scenario: Snoozed email returns to inbox after duration expires
    Given an email was snoozed for 1 hour
    And 1 hour has passed
    When I refresh the inbox
    Then the snoozed email should reappear in the inbox
    And a notification should indicate the email has returned

  Scenario: Cancel snooze before duration expires
    Given an email is snoozed
    When I open the "Snoozed" section
    And I click "Unsnooze" on the email
    Then the email should immediately return to the inbox

  Scenario: Snooze from email detail view
    When I open an email
    Then a snooze button should be visible in the email toolbar
    When I click snooze and select "1 jour"
    Then the email should be snoozed and I should return to the inbox

  Scenario: Bulk snooze via floating action bar
    When I select 3 emails via checkboxes
    And I click the "Snooze" action in the floating action bar
    Then a snooze duration picker should appear
    And selecting a duration should snooze all selected emails
