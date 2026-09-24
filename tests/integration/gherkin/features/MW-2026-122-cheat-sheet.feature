Feature: MW-2026-122 — Email cheat sheet (keyboard shortcuts modal + search)
  As a user who wants to be more productive
  I want to see all available keyboard shortcuts in a searchable modal
  So that I can learn and use shortcuts efficiently

  Background:
    Given I am logged in as admin on "https://mail.misfits.ai"
    And I am on the inbox page "/mail"

  Scenario: Open cheat sheet via keyboard shortcut from inbox
    When I press the "?" key
    Then a modal should appear showing keyboard shortcuts grouped by category

  Scenario: Shortcuts are grouped by category
    When the cheat sheet modal is open
    Then shortcuts should be grouped under: Navigation, Composition, Actions, Search

  Scenario: Search/filter shortcuts by name
    When I type "archive" in the cheat sheet search field
    Then only shortcuts containing "archive" should be visible

  Scenario: Close modal with Escape
    When the cheat sheet modal is open
    And I press the Escape key
    Then the modal should close

  Scenario: Close modal by clicking outside
    When the cheat sheet modal is open
    And I click outside the modal
    Then the modal should close

  Scenario: Link to full documentation
    When the cheat sheet modal is open
    Then a link to the full documentation should be visible

  Scenario: Security — cheat sheet requires authentication
    Given I am not logged in
    When I press "?" on the login page
    Then no cheat sheet modal should appear
