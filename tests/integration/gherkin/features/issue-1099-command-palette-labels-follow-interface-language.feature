# language: en
Feature: Command palette labels follow the interface language
  The command palette labels, groups and placeholder ("Aller à", "Composer un email",
  "Recherche", "Paramètres", "Calendrier", "Nouvel email", "Archiver", "Supprimer",
  "Favoris", "Marquer comme non lu", "Changer le thème", "Notifications",
  "Raccourcis clavier", "Aucun email trouvé pour cette recherche.") are hardcoded in French,
  while the landing page and the layout metadata are in English. A user who chose
  English sees a mixed-language interface.

  Background:
    Given the user is signed in
    And the command palette is opened

  @AC1
  Scenario: The command palette uses the same language as the rest of the interface
    Given the rest of the interface is in English
    When the command palette is displayed
    Then the command palette uses the same language as the rest of the interface

  @AC1
  Scenario: Every label, group and placeholder of the palette is in the language of the interface
    Given the interface language is English
    When the command palette is displayed
    Then every label of the palette is in English
    And every group heading of the palette is in English
    And the placeholder of the palette is in English

  @AC2
  Scenario: The language of the palette follows the user's locale setting
    Given the user's locale setting is English
    When the command palette is displayed
    Then every label, group heading and placeholder of the palette is in English

  @AC2
  Scenario: The language of the palette follows a locale other than the default
    Given the user's locale setting is not the default language
    When the command palette is displayed
    Then every label, group heading and placeholder of the palette is in the locale language

  @AC3
  Scenario: No mixed-language label remains in the palette
    Given the interface language is English
    When the command palette is displayed
    Then no label, group heading or placeholder of the palette is in another language

  @AC3
  Scenario: The empty state of the palette is in the interface language
    Given the interface language is English
    When the user searches the palette without any result
    Then the empty state of the palette is in English
