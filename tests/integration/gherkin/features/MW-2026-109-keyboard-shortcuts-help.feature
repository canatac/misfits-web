Feature: MW-2026-109 — Keyboard shortcuts help panel
  As a power user
  I want to see all available keyboard shortcuts in a help panel
  So that I can learn and use keyboard shortcuts efficiently

  Background:
    Given I am logged in as admin on "https://mail.misfits.ai"
    And I am on the inbox page "/mail"

  Scenario: Ctrl+/ opens keyboard shortcuts help panel
    When I press "Ctrl+/"
    Then a keyboard shortcuts help panel or modal should appear

  Scenario: Help panel lists all available shortcuts
    When I open the keyboard shortcuts help panel
    Then the panel should list available keyboard shortcuts
    And each shortcut should show its key combination and description

  Scenario: ESC closes the help panel
    When the keyboard shortcuts help panel is open
    And I press the "Escape" key
    Then the help panel should close
    And the inbox should regain focus

  Scenario: Help panel is accessible from settings menu
    When I open the settings menu
    Then a "Keyboard shortcuts" option should be available
    And clicking it should open the help panel

  Scenario: Help panel supports search/filter
    When the keyboard shortcuts help panel is open
    And I type in the search field
    Then the shortcuts list should filter to show only matching entries
