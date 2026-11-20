Feature: Command palette labels follow the selected language
  The palette is the one screen a keyboard-first user meets most: its commands,
  groups and empty state must be in the interface language selected by the user,
  and the shortcuts help must use the same strings.

  Background:
    Given the user is signed in
    And the command palette is opened

  @AC1
  Scenario: Palette labels, groups and empty state follow the selected language
    Given the interface language is set to English
    When the user opens the command palette
    Then every label of the palette is in English
    And every group heading of the palette is in English
    And the placeholder of the search field is in English
    And when no email matches the query the empty state is in English

  @AC1
  Scenario: Palette labels follow a language other than the default
    Given the interface language is set to French
    When the user opens the command palette
    Then every label of the palette is in French
    And every group heading of the palette is in French
    And the empty state is in French

  @AC2
  Scenario: The same strings are used in the shortcuts help
    Given the interface language is set to English
    When the user opens the shortcuts help
    Then the strings of the shortcuts help are the same as those of the command palette
    And the strings of the shortcuts help are in English

  @AC3
  Scenario: A test asserts the palette renders in the selected language
    Given the interface language is set to English
    When the palette is rendered
    Then a test asserts the palette renders in the selected language
