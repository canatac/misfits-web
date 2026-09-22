Feature: MW-2026-037 — UX unified search bar
  As a user
  I want a unified search bar with natural language support
  So that I can quickly find emails using free-text queries

  Background:
    Given I am logged in as "qa.admin@misfits.fr"
    And I am on the mail dashboard

  Scenario: Search bar is visible in the UI
    Then I should see a search bar at the top of the interface
    And it should have a placeholder text indicating search capability

  Scenario: Keyboard shortcut opens search
    When I press "Ctrl+K" or "/"
    Then the search bar should be focused and ready for input

  Scenario: Natural language search returns results
    When I type "emails from john last week" in the search bar
    Then relevant emails should be displayed in the results
    And search filters should be available to refine results
