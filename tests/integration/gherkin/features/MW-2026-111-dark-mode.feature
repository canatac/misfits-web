Feature: MW-2026-111 — Dark mode + theme customization
  As a user of the mail interface
  I want to switch between light and dark themes
  So that I can use the app comfortably in any lighting condition

  Background:
    Given I am logged in as admin on "https://mail.misfits.ai"
    And I am on the inbox page "/mail"

  Scenario: Theme toggle is visible
    When the inbox loads
    Then a theme toggle or dark mode switch should be visible in the UI

  Scenario: Toggling dark mode changes the background
    When I click the theme toggle to enable dark mode
    Then the page background color should change to a dark color
    And the text color should invert to a light color

  Scenario: All UI elements remain readable in dark mode
    When dark mode is enabled
    Then all text should remain clearly readable
    And buttons and interactive elements should be visible
    And email list items should have sufficient contrast

  Scenario: Theme preference persists across sessions
    When I enable dark mode
    And I reload the page
    Then dark mode should still be active
    And the dark background color should be applied

  Scenario: Toggling back to light mode works
    When dark mode is enabled
    And I click the theme toggle to disable dark mode
    Then the page should return to the light theme
    And the background color should be light
