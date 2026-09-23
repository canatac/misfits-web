Feature: Keyboard shortcuts system for power users (UX #749)
  As a power user
  I want keyboard shortcuts for all major actions
  So that I can navigate and act without using the mouse

  Background:
    Given the user is authenticated
    And the user is on the dashboard

  Scenario: Open keyboard shortcut help overlay with "?"
    When I press the "?" key
    Then a modal overlay is displayed
    And the modal lists keyboard shortcuts grouped by category
    And the categories include "Navigation", "Compose", and "Actions"

  Scenario: Close shortcut overlay with Escape
    Given the keyboard shortcut overlay is open
    When I press the "Escape" key
    Then the overlay is closed
    And the dashboard is visible again

  Scenario: Compose new email with "c" key
    When I press the "c" key
    Then the email composer opens
    And the "To" field is focused

  Scenario: Search with "/" key
    When I press the "/" key
    Then the search bar is focused
    And I can type a search query

  Scenario: Navigate email list with j/k keys
    When I press the "j" key
    Then the next email in the list is selected
    When I press the "k" key
    Then the previous email in the list is selected

  Scenario: Archive selected email with "e" key
    Given an email is selected in the list
    When I press the "e" key
    Then the selected email is archived
    And a toast "Email archived — Undo" is visible

  Scenario: Delete selected email with "#" key
    Given an email is selected in the list
    When I press the "#" key
    Then the selected email is moved to trash
    And a toast "Email deleted — Undo" is visible

  Scenario: Reply to email with "r" key
    Given an email is open
    When I press the "r" key
    Then the reply composer opens
    And the cursor is in the body field

  Scenario: Mark as read/unread with "u" key
    Given an email is selected
    When I press the "u" key
    Then the email's read status is toggled

  Scenario: Shortcut hints on hover for icon buttons
    When I hover over an icon button
    Then a tooltip with the keyboard shortcut is shown
