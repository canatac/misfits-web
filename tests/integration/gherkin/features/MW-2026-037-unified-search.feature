Feature: MW-2026-037 — UX unified search bar
  As a user
  I want a unified search bar with natural language support
  So that I can quickly find emails, contacts, and actions

  Background:
    Given I am logged in as "qa.admin@misfits.fr"
    And I am on the mail dashboard

  Scenario: Search bar is visible in the header
    Then I should see a unified search bar in the header area
    And it should have a keyboard shortcut indicator (Ctrl+K)

  Scenario: Natural language search query
    When I type "emails from Jean last week" in the search bar
    Then I should see filtered results matching the query
    And the search should support natural language filters

  Scenario: Search filters are available
    When I focus the search bar
    Then I should see filter options (date, sender, folder, etc.)

  Scenario: Search results display
    When I search for "invoice"
    Then matching emails should be displayed in the results
    And results should update within 2 seconds
