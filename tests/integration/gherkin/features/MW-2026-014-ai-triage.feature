Feature: MW-2026-014 — AI smart triage
  As a user
  I want my inbox to automatically sort emails by priority
  So that I can focus on what matters most

  Background:
    Given I am logged in as "qa.admin@misfits.fr"
    And I have 50 unread emails in my inbox

  Scenario: AI triage sorts inbox by priority
    When I open the inbox
    Then emails should be sorted by AI-detected priority
    And high-priority emails should appear first

  Scenario: AI triage shows action suggestions
    Given I see a triaged email
    Then I should see action suggestions (Reply, Archive, Delete)
    And each suggestion should have a confidence indicator

  Scenario: Triage badge visible on emails
    Given the inbox is triaged
    Then each email should show a priority badge (High/Medium/Low)
    And the badge should be color-coded

  Scenario: User can override triage
    Given an email is marked as low priority
    When I mark it as high priority manually
    Then the AI should learn from this correction
    And future triage should reflect the preference

  Scenario: Triage processes 50 emails in under 10 seconds
    Given I have 50 unread emails
    When AI triage runs
    Then all emails should be sorted within 10 seconds
    And the UI should show a progress indicator
