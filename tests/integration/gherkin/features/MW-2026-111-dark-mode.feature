Feature: MW-2026-111 — Dark mode and theme customization
  As a user who prefers dark interfaces
  I want to switch the email client to dark mode
  So that I can use it comfortably in low-light conditions

  Background:
    Given I am logged in as admin on "https://mail.misfits.ai"
    And I am on the inbox page "/mail"

  Scenario: Dark mode toggle is visible
    When the inbox loads
    Then a theme toggle or dark mode option should be visible

  Scenario: Switching to dark mode
    When I activate dark mode
    Then the background should change to a dark color
    And the text should change to a light color
    And all UI elements should remain readable

  Scenario: Switching back to light mode
    When dark mode is active
    And I deactivate dark mode
    Then the background should return to the light color
    And the text should return to the dark color

  Scenario: Theme preference persists across sessions
    When I activate dark mode
    And I refresh the page
    Then dark mode should still be active

  Scenario: Security — theme preference requires authentication
    Given I am not logged in
    When I attempt to change theme settings
    Then I should be redirected to "/login"
