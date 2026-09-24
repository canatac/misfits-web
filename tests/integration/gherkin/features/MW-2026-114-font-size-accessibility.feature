Feature: MW-2026-114 — Font size accessibility control (WCAG 1.4.4)
  As a user with visual accessibility needs
    I want to change the font size of the interface via Theme Settings
  So that I can read emails comfortably according to my preference (WCAG 1.4.4 Resize Text)

  Background:
    Given I am logged in as admin on "https://mail.misfits.ai"
    And I am on the inbox page "/mail"

  Scenario: Font size options are available in Theme Settings
    When I open the Settings page
    And I navigate to the Theme settings section
    Then I should see a font size selector with 4 options: Small, Medium, Large, Extra Large

  Scenario: Small font size option applies 12px
    When I open the Theme settings
    And I select the "Small" font size option
    Then the interface font size should be set to 12px
    And the layout should remain intact without overflow or clipping

  Scenario: Medium font size option applies 14px (default)
    When I open the Theme settings
    And I select the "Medium" font size option
    Then the interface font size should be set to 14px
    And the layout should remain intact without overflow or clipping

  Scenario: Large font size option applies 16px
    When I open the Theme settings
    And I select the "Large" font size option
    Then the interface font size should be set to 16px
    And the layout should remain intact without overflow or clipping

  Scenario: Extra Large font size option applies 18px
    When I open the Theme settings
    And I select the "Extra Large" font size option
    Then the interface font size should be set to 18px
    And the layout should remain intact without overflow or clipping

  Scenario: Font size preference persists across page reloads
    When I open the Theme settings
    And I select the "Large" font size option
    And I reload the page
    Then the font size should still be set to 16px
    And the "Large" option should appear as selected in Theme settings

  Scenario: Font size preference persists in localStorage
    When I open the Theme settings
    And I select the "Extra Large" font size option
    Then the preference should be saved in localStorage
    And on next page load the font size should be restored to 18px

  Scenario: Layout remains intact at all font sizes
    When I open the Theme settings
    And I select each font size option in sequence
    Then no text should be clipped or overflow its container
    And no UI elements should overlap
    And the inbox list should remain scrollable and functional

  Scenario: Email content respects font size setting
    When I set the font size to "Extra Large"
    And I open an email from the inbox
    Then the email body text should render at the selected font size
    And the email should be fully readable without horizontal scrolling
