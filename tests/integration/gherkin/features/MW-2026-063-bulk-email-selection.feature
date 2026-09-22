Feature: MW-2026-063 — Bulk email selection with floating action bar
  As a user
  I want to select multiple emails and see a floating action bar with bulk actions
  So that I can archive, delete, mark as read, or move multiple emails at once

  Background:
    Given I am logged in as admin on "https://mail.misfits.ai"
    And I am on the inbox page "/mail"
    And the inbox contains at least 3 emails

  Scenario: Single email selection shows checkbox
    When I look at the inbox email list
    Then each email row should display a checkbox or selection control

  Scenario: Selecting one email reveals the floating action bar
    When I click the checkbox on one email
    Then a floating action bar should appear at the bottom or top of the list
    And the action bar should display the count of selected emails "1"

  Scenario: Selecting multiple emails updates the count
    When I click the checkbox on 3 emails
    Then the floating action bar should display "3 selected"

  Scenario: Select all checkbox selects every email in the list
    When I click the "Select all" checkbox in the list header
    Then all emails in the current list should be selected
    And the action bar should display the total count

  Scenario: Floating action bar contains Archive action
    When I select one or more emails
    Then the floating action bar should contain an "Archive" button
    When I click "Archive"
    Then the selected emails should be moved out of the inbox
    And the action bar should disappear

  Scenario: Floating action bar contains Delete action
    When I select one or more emails
    Then the floating action bar should contain a "Delete" button
    When I click "Delete"
    Then the selected emails should be moved to trash
    And the action bar should disappear

  Scenario: Floating action bar contains Mark as Read action
    When I select one or more unread emails
    Then the floating action bar should contain a "Mark as read" button
    When I click "Mark as read"
    Then the selected emails should be marked as read
    And the action bar should disappear

  Scenario: Floating action bar contains Mark as Unread action
    When I select one or more read emails
    Then the floating action bar should contain a "Mark as unread" button
    When I click "Mark as unread"
    Then the selected emails should be marked as unread

  Scenario: Deselecting all emails hides the floating action bar
    When I select 2 emails
    And I click the checkbox on each selected email to deselect them
    Then the floating action bar should disappear

  Scenario: Clicking outside selection clears the selection
    When I select one or more emails
    And I click "Clear" or click outside the selection area
    Then all emails should be deselected
    And the floating action bar should disappear

  Scenario: Bulk action requires authentication
    Given I am not authenticated
    When I send a POST request to "/api/emails/bulk-action" with body {"action":"archive","ids":["id1","id2"]}
    Then the response status should be 401
    And no email data should be modified

  Scenario: POST /api/emails/bulk-action with valid auth processes bulk action
    Given I have a valid admin session token
    When I send a POST request to "/api/emails/bulk-action" with body {"action":"archive","ids":["test-id-1","test-id-2"]}
    Then the response status should be 200
    And the response should contain a success confirmation
