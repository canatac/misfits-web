Feature: MW-2026-076 — Disposable email aliases management
  As a user with disposable aliases
  I want to manage my aliases (disable, view logs)
  So that I can control spam and track which services have my alias

  Background:
    Given the user is logged in to mail.misfits.ai
    And the user navigates to Settings > Email Aliases

  Scenario: Disable an alias receiving spam
    Given an alias "xyz123@misfits.ai" exists and is active
    When the user clicks "Disable" on the alias
    Then the alias status changes to "Disabled"
    And emails sent to the alias are rejected

  Scenario: View service log for an alias
    Given an alias "xyz123@misfits.ai" exists
    When the user clicks "View log" on the alias
    Then a list of services that sent emails to the alias is displayed
    And each entry shows the service name and timestamp

  Scenario: API endpoint exists for alias management
    When the user sends "PATCH /api/aliases/xyz123"
    Then the response status is 200 or 401
