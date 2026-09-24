Feature: Desktop notification for new emails
  As a user
  I want desktop notifications when new emails arrive
  So that I am aware of incoming emails without keeping the mailbox tab open

  Background:
    Given the user is logged in to mail.misfits.ai
    And the browser supports the Notification API

  Scenario: Request notification permission on login
    When the user logs in for the first time
    Then a notification permission prompt is displayed
    And the user can allow or deny notifications

  Scenario: Desktop notification on new email arrival
    Given the user has allowed notifications
    And the user inbox tab is open but not focused
    When a new email arrives in the inbox
    Then a desktop notification is shown
    And the notification contains the sender name
    And the notification contains a subject preview
    And the notification contains the sender avatar

  Scenario: Click notification opens inbox and highlights email
    Given a desktop notification is displayed for a new email
    When the user clicks the notification
    Then the inbox tab is focused
    And the new email is highlighted in the inbox list

  Scenario: Per-folder notification toggle
    Given the user is in Settings > Notifications
    When the user enables notifications for "Important" folder only
    Then only emails in the Important folder trigger desktop notifications

  Scenario: Do Not Disturb suppresses notifications
    Given the user has enabled Do Not Disturb mode
    When a new email arrives
    Then no desktop notification is shown

  Scenario: Graceful fallback when notification API unavailable
    Given the browser does not support the Notification API
    When the user logs in
    Then no notification permission prompt is shown
    And the application continues to function normally
