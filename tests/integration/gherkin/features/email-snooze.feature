Feature: Email snooze presets (MW-2026-083 / UX-779)
  As a user with a busy inbox
  I want to temporarily remove emails and have them reappear later
  So that I can focus on what matters now without losing track of deferred emails

  Background:
    Given the user is authenticated
    And the user is on the inbox view
    And there is at least one email in the inbox

  Scenario: Snooze an email for 1 hour
    When I click the "Snooze" button on an email
    And I select "1 hour" from the snooze presets
    Then the email disappears from the inbox
    And a toast "Email snoozed — will return in 1 hour" is visible
    And the snooze badge counter increments by 1

  Scenario: Snooze an email for 1 day
    When I click the "Snooze" button on an email
    And I select "1 day" from the snooze presets
    Then the email disappears from the inbox
    And a toast "Email snoozed — will return in 1 day" is visible

  Scenario: Snooze an email for 1 week
    When I click the "Snooze" button on an email
    And I select "1 week" from the snooze presets
    Then the email disappears from the inbox
    And a toast "Email snoozed — will return in 1 week" is visible

  Scenario: View snoozed emails
    Given an email has been snoozed
    When I click the "Snoozed" section in the navigation
    Then the snoozed email is visible in the Snoozed view
    And a "Cancel snooze" button is available on the email

  Scenario: Cancel snooze returns email to inbox
    Given an email is in the Snoozed view
    When I click "Cancel snooze"
    Then the email returns to the inbox immediately
    And the snooze badge counter decrements by 1

  Scenario: Snooze badge counter visible in navigation
    Given an email has been snoozed
    When I look at the navigation sidebar
    Then a badge with the count of snoozed emails is visible next to "Snoozed"

  Scenario: Mobile snooze overlay
    Given the user is on a mobile viewport
    When I click the "Snooze" button on an email
    Then an overlay with snooze presets is displayed
    And the presets include "1 hour", "1 day", and "1 week"
