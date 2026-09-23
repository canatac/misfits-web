Feature: Email bulk actions toolbar (MW-2026-092 / issue #713)
  As a user with many emails to process
  I want to select multiple emails and perform bulk actions
  So that I can efficiently manage my inbox

  Background:
    Given the user is authenticated
    And the user is on the inbox view
    And there are at least 3 emails in the inbox

  Scenario: Select multiple emails via checkboxes
    When I click the checkbox on the first email row
    And I click the checkbox on the second email row
    Then a floating toolbar appears with action buttons
    And the toolbar shows a selection count of "2"

  Scenario: Bulk archive selected emails
    When I select 2 emails via checkboxes
    And I click the "Archive" button in the bulk toolbar
    Then the selected emails are moved to the Archive folder
    And a toast notification confirms "2 emails archived"
    And the selection is cleared

  Scenario: Bulk delete selected emails
    When I select 2 emails via checkboxes
    And I click the "Delete" button in the bulk toolbar
    Then the selected emails are moved to the Trash folder
    And a toast notification confirms "2 emails deleted"
    And the selection is cleared

  Scenario: Bulk mark as read
    When I select 2 unread emails via checkboxes
    And I click the "Mark as read" button in the bulk toolbar
    Then the selected emails are marked as read
    And a toast notification confirms "2 emails marked as read"

  Scenario: Bulk apply label
    When I select 2 emails via checkboxes
    And I click the "Label" button in the bulk toolbar
    Then a label picker is displayed
    And I can select a label to apply to all selected emails

  Scenario: Select all emails
    When I click the "Select all" checkbox in the header
    Then all visible emails are selected
    And the toolbar shows the total count of selected emails

  Scenario: Undo last bulk action
    When I select 2 emails and archive them
    And I click the "Undo" button in the toast notification
    Then the emails are restored to the inbox
    And a toast confirms the undo action

  Scenario: Toolbar disappears when selection cleared
    When I select 1 email via checkbox
    And I deselect the email
    Then the floating toolbar is no longer visible
