Feature: Font size accessibility control (WCAG 1.4.4)
  As a user with visual impairments
  I want to adjust the font size so I can read emails comfortably

  Background:
    Given the user is logged in to mail.misfits.ai
    And the Theme Settings panel is accessible

  Scenario: Font size selector is available in Theme Settings
    When the user opens the Theme Settings panel
    Then a font size selector is visible
    And it offers 4 options: Small, Medium, Large, Extra Large

  Scenario: Selecting Large font size scales text
    When the user opens the Theme Settings panel
    And the user selects "Large" font size
    Then the base font size is set to 16px
    And all text elements scale proportionally

  Scenario: Font size preference persists across sessions
    When the user opens the Theme Settings panel
    And the user selects "Extra Large" font size
    And the user refreshes the page
    Then the font size is still set to Extra Large
    And the preference is stored in localStorage

  Scenario: Layout remains intact at all font sizes
    When the user opens the Theme Settings panel
    And the user selects "Extra Large" font size
    Then there is no horizontal overflow
    And no UI elements overlap
    And the inbox list is fully readable

  Scenario: Small font size option works
    When the user opens the Theme Settings panel
    And the user selects "Small" font size
    Then the base font size is set to 12px
    And the inbox list displays correctly
    And the compose area displays correctly

  Scenario: Medium is the default font size
    When the user opens the Theme Settings panel for the first time
    Then "Medium" is selected by default
    And the base font size is 14px
