# language: en
Feature: Command palette labels follow the interface language
  The command palette is the keyboard-first entry point of the product, but its
  labels, group headings and placeholder are hardcoded in French while the rest
  of the interface is in the language the user selected. A user who set English
  sees a mixed-language palette and cannot search it by command name.

  Background:
    Given the user is signed in
    And the command palette is opened

  @AC1
  Scenario: Every label, group heading and placeholder of the palette is in the selected language
    Given the interface language selected by the user is English
    When the command palette is displayed
    Then every label of the palette is in English
    And every group heading of the palette is in English
    And the placeholder of the palette is in English

  @AC1
  Scenario: The palette labels follow a language other than the default
    Given the interface language selected by the user is not the default language
    When the command palette is displayed
    Then every label, group heading and placeholder of the palette is in the selected language

  @AC2
  Scenario: The default English wording is consistent with the landing page and the shortcut settings
    Given the interface language selected by the user is English
    When the command palette is displayed
    Then the default English wording of the palette is consistent with the landing page
    And the default English wording of the palette is consistent with the shortcut settings

  @AC3
  Scenario: The palette is usable with the keyboard alone and the active item has a visible focus
    Given the command palette is open
    When the user moves the selection using the keyboard alone
    Then the active item has a visible focus indicator
    And the user can run the active command and close the palette using the keyboard alone

  @AC3
  Scenario: The user can search the palette by command name
    Given the command palette is open
    When the user types the name of a command
    Then the palette lists the command matching the query
