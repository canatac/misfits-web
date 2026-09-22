Feature: MW-2026-063 Bulk email selection with floating action bar
  As a power user
  I want to select multiple emails via checkboxes and perform bulk actions from a floating bar
  So that I can efficiently triage high-volume inboxes

  Background:
    Given the user is authenticated on https://mail.misfits.ai
    And the inbox contains at least 3 emails

  Scenario: Selecting multiple emails shows floating action bar with count
    Given the user is viewing the inbox
    When the user selects 3 emails via checkboxes
    Then a floating action bar appears at the bottom
    And the bar displays "3 selected"
    And the bar contains actions: Archive, Mark read, Delete, Move, Label, Snooze

  Scenario: Archive bulk action moves emails and dismisses bar
    Given the user has selected 3 emails
    When the user clicks "Archive" in the floating action bar
    Then the 3 emails are moved to the Archive folder
    And the floating action bar dismisses
    And all checkboxes are unchecked

  Scenario: Mark as read bulk action updates email status
    Given the user has selected 2 unread emails
    When the user clicks "Mark read" in the floating action bar
    Then both emails are marked as read
    And the floating action bar dismisses

  Scenario: Delete bulk action removes emails
    Given the user has selected 2 emails
    When the user clicks "Delete" in the floating action bar
    Then both emails are moved to Trash
    And the floating action bar dismisses

  Scenario: Deselect all hides the floating action bar
    Given the user has selected 3 emails
    When the user deselects all emails
    Then the floating action bar disappears

  Scenario: POST /api/emails/action bulk requires authentication
    Given no session token is provided
    When POST /api/emails/action with body {"action":"archive","ids":["1","2"]} is sent
    Then the response status is 401
    And the response body contains an authentication error
    And no email data is leaked
