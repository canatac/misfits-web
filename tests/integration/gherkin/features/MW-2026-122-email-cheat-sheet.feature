Feature: MW-2026-122 Email cheat sheet — keyboard shortcuts modal + search
  As a user
  I want to view all available keyboard shortcuts in a searchable modal
  So that I can learn and use keyboard shortcuts to improve productivity

  Background:
    Given the user is logged in
    And the user is on the inbox page

  Scenario: Open cheat sheet via keyboard shortcut "?"
    When the user presses the "?" key
    Then a modal displaying keyboard shortcuts is visible
    And the modal shows shortcuts grouped by category

  Scenario: Shortcuts are grouped by category
    When the user opens the cheat sheet modal
    Then the following categories are displayed:
      | category   |
      | Navigation |
      | Composition|
      | Actions    |
      | Recherche  |
    And each category contains at least one shortcut entry

  Scenario: Search filters shortcuts by name
    When the user opens the cheat sheet modal
    And the user types "archive" in the search field
    Then only shortcuts matching "archive" are displayed
    And the search results count is visible

  Scenario: Close cheat sheet via Escape key
    Given the cheat sheet modal is open
    When the user presses the "Escape" key
    Then the modal is closed
    And the inbox page is visible

  Scenario: Close cheat sheet via click outside
    Given the cheat sheet modal is open
    When the user clicks outside the modal
    Then the modal is closed

  Scenario: Cheat sheet accessible from composer toolbar
    When the user navigates to the compose page
    And the user clicks the cheat sheet button in the toolbar
    Then the keyboard shortcuts modal is visible

  Scenario: Documentation link is present
    When the user opens the cheat sheet modal
    Then a link to the full documentation is visible
