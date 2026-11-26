@issue-1219
Feature: Command palette search field accessible name
  As a screen reader user
  I want the command palette search field to have an accessible name
  So that I can understand its purpose when it receives focus

  Scenario: The palette input exposes an accessible name bound to the current language
    Given the command palette is open
    When I inspect the search input element
    Then the input has an accessible name attribute set to the current language's label
    And the accessible name is not empty

  Scenario: The name is announced when the field receives focus
    Given the command palette is open
    When I focus the search input with a screen reader
    Then the screen reader announces the accessible name of the input

  Scenario: The visible placeholder is kept and does not replace the accessible name
    Given the command palette is open
    When I inspect the search input element
    Then the input has a placeholder attribute set to the current language's placeholder text
    And the accessible name is different from the placeholder text