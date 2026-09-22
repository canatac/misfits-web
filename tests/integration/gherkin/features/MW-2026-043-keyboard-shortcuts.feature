Feature: MW-2026-043 — Keyboard shortcuts system for power users
  As a power user
  I want to navigate and act on emails using keyboard shortcuts with a help panel
  So that I can work efficiently without reaching for the mouse

  Background:
    Given I am logged in as admin on "https://mail.misfits.ai"
    And I am on the inbox page "/mail"

  Scenario: Pressing C opens the composer
    When I press the "c" key
    Then the email composer should open
    And the "To" field should be focused

  Scenario: Pressing Ctrl+/ opens the keyboard shortcuts help panel
    When I press "Control" + "/"
    Then the keyboard shortcuts help panel should be visible
    And it should list at least 5 shortcuts

  Scenario: Pressing ? opens the keyboard shortcuts help panel (alternative)
    When I press the "?" key
    Then the keyboard shortcuts help panel should be visible
    And it should list at least 5 shortcuts

  Scenario: Tooltips show keyboard shortcuts on action buttons
    When I hover over the compose button
    Then a tooltip showing the keyboard shortcut should be visible

  Scenario: Full inbox navigation via keyboard
    Given I am on the inbox page
    When I press the "j" key
    Then the next email in the list should be selected
    When I press the "k" key
    Then the previous email in the list should be selected

  Scenario: Archive action via keyboard
    Given an email is selected in the inbox
    When I press the "e" key
    Then the selected email should be archived
    And a confirmation toast should appear
