Feature: MW-2026-134 Email composer spell check — inline suggestions + language selector
  As a user
  I want real-time spell checking in the email composer
  So that I can correct typos before sending

  Background:
    Given the user is logged in
    And the user is on the compose page

  Scenario: Misspelled words are underlined in red
    When the user types "Ths is a test" in the composer body
    Then the word "Ths" has a red underline

  Scenario: Right-click shows spelling suggestions
    Given a misspelled word is underlined in the composer
    When the user right-clicks on the misspelled word
    Then a context menu with spelling suggestions is displayed
    And the menu contains at least 3 suggestions

  Scenario: Selecting a suggestion replaces the word
    Given the spelling suggestions menu is visible
    When the user clicks on the first suggestion
    Then the misspelled word is replaced with the selected suggestion
    And the context menu is closed

  Scenario: Language selector in composer toolbar
    When the user views the composer toolbar
    Then a language selector is visible
    And the selector contains options: FR, EN, ES, DE

  Scenario: Switching language loads new dictionary
    Given the language selector is set to "EN"
    When the user selects "FR" from the language selector
    Then the spell check dictionary is updated to French
    And subsequent typing is checked against the French dictionary

  Scenario: Spell check toggle in settings
    When the user navigates to Settings > Composer
    Then a spell check toggle is visible
    When the user disables the toggle
    And the user returns to the composer
    Then no red underlines are displayed for misspelled words

  Scenario: Ignore word option
    Given a misspelled word is underlined in the composer
    When the user right-clicks on the word
    And the user selects "Ignore"
    Then the word no longer has a red underline
    And the word is added to the user dictionary
