Feature: MW-2026-063 — Bulk email selection with floating action bar
  As a power user managing high-volume inboxes
  I want to select multiple emails via checkboxes and see a floating action bar
  So that I can perform bulk operations (archive, delete, mark read, move, label, snooze) efficiently

  Background:
    Given I am logged in as admin on "https://mail.misfits.ai"
    And I am on the inbox page "/mail"
    And the inbox contains at least 3 emails

  Scenario: Selecting emails reveals floating action bar with count
    When I select 3 emails via checkboxes in the inbox list
    Then a floating action bar should appear at the bottom of the screen
    And the bar should display "3 sélectionnés" or show count=3
    And the bar should contain actions: Archive, Mark read/unread, Delete, Move to folder, Label, Snooze

  Scenario: Floating action bar shows correct selection count
    When I select 1 email via checkbox
    Then the floating action bar should show count=1
    When I select 2 more emails
    Then the floating action bar should show count=3

  Scenario: Bulk archive moves emails and dismisses bar
    When I select 3 emails via checkboxes
    And I click the "Archive" action in the floating action bar
    Then the selected emails should move to the Archive folder
    And the floating action bar should be dismissed
    And all checkboxes should be deselected

  Scenario: Bulk delete moves emails to trash and dismisses bar
    When I select 2 emails via checkboxes
    And I click the "Delete" action in the floating action bar
    Then the selected emails should move to the Trash folder
    And the floating action bar should be dismissed

  Scenario: Deselecting all emails dismisses the floating action bar
    When I select 3 emails via checkboxes
    And I deselect all emails
    Then the floating action bar should be hidden

  Scenario: Floating action bar is not visible with zero selection
    Given no emails are selected
    Then the floating action bar should NOT be visible

  Scenario: Selection persists across inbox scroll
    When I select 2 emails via checkboxes
    And I scroll the inbox list
    Then the 2 emails should remain selected
    And the floating action bar should still show count=2

  Scenario: Floating action bar has snooze option
    When I select 1 email via checkbox
    And I click the "Snooze" action in the floating action bar
    Then a snooze date/time picker should appear
