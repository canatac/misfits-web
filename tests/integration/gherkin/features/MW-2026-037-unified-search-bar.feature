Feature: MW-2026-037 — Unified search bar
  As a user
  I want a unified search bar with natural language support and keyboard shortcut
  So that I can quickly find emails using natural language queries and filters

  Background:
    Given I am logged in as admin on "https://mail.misfits.ai"
    And I am on the inbox page "/mail"

  Scenario: Search bar is visible in the interface
    When I view the main interface
    Then a unified search bar should be visible
    And it should be accessible via the Ctrl+K keyboard shortcut

  Scenario: Ctrl+K opens the search bar
    When I press Ctrl+K
    Then the search bar should receive focus
    And the search input should be ready for typing

  Scenario: Natural language search works
    When I type "emails from John last week" in the search bar
    Then the search should interpret the natural language query
    And return relevant results from sender John within the last 7 days

  Scenario: Search filters are available
    When I open the search bar
    Then filter options should be available (by sender, date, subject, has attachment)
    And I can combine multiple filters

  Scenario: Search results show matching emails
    When I search for a known sender
    Then only emails matching the query should be displayed
    And the results should update as I type (debounced)

  Scenario: Clear search returns to normal inbox
    When I have an active search query
    And I clear the search input
    Then the full inbox should be restored
    And the search bar should remain visible

  Scenario: Search with no results shows empty state
    When I search for a query that matches no emails
    Then an empty state message should be displayed
    And suggestions or tips should be shown

  Scenario: Search shortcut help panel
    When I press Ctrl+/
    Then a keyboard shortcuts help panel should be displayed
    And it should list the search shortcut (Ctrl+K)
