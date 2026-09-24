Feature: MW-2026-138 — Email list bulk selection toolbar
  As a user with many emails to process
  I want to select multiple emails and perform batch actions from a floating toolbar
  So that I can efficiently manage my inbox

  Background:
    Given I am logged in as admin on "https://mail.misfits.ai"
    And I am on the inbox page "/mail"
    And the inbox contains at least 3 emails

  Scenario: Bulk selection mode is accessible
    When I click the checkbox toggle in the inbox header
    Then each email row should display a checkbox
    And the floating action toolbar should be hidden when 0 emails are selected

  Scenario: Selecting emails shows the floating toolbar with counter
    When I select 2 emails via their checkboxes
    Then a floating toolbar should appear at the bottom
    And the toolbar should display "2 selected"
    And the toolbar should show actions: Archive, Mark read, Delete, Move, Label, Snooze

  Scenario: Select all toggle
    When I click "Select all"
    Then all visible emails should be checked
    And the counter should show the total number of emails

  Scenario: Deselect all
    When all emails are selected
    And I click "Deselect all"
    Then no emails should be checked
    And the floating toolbar should be hidden

  Scenario: Batch archive action
    When I select 2 emails
    And I click "Archive" in the floating toolbar
    Then the selected emails should disappear from the inbox
    And a confirmation toast should appear

  Scenario: Batch delete with undo
    When I select 1 email
    And I click "Delete" in the floating toolbar
    Then the selected email should move to trash
    And an undo toast should appear with a 5s window

  Scenario: Exit selection mode with Escape
    When I select 1 email
    And I press the Escape key
    Then selection mode should be exited
    And the floating toolbar should be hidden
    And no emails should remain checked

  Scenario: Security — batch actions require authentication
    Given I am not logged in
    When I attempt to access bulk selection endpoints
    Then I should be redirected to "/login"
