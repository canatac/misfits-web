Feature: Command palette message actions
  The command palette lists Archiver, Supprimer, Favoris and Marquer comme non lu.
  A keyboard-first user who invokes one of them expects the action to be applied to the open email.

  Background:
    Given the user is signed in
    And an email is open in the inbox

  @AC1
  Scenario: Archiver applies to the open email and closes the palette
    Given the command palette is open
    When the user runs the command "Archiver"
    Then the open email is archived
    And the command palette is closed

  @AC1
  Scenario: Supprimer applies to the open email and closes the palette
    Given the command palette is open
    When the user runs the command "Supprimer"
    Then the open email is deleted
    And the command palette is closed

  @AC1
  Scenario: Favoris applies to the open email and closes the palette
    Given the command palette is open
    When the user runs the command "Favoris"
    Then the open email is starred
    And the command palette is closed

  @AC1
  Scenario: Marquer comme non lu applies to the open email and closes the palette
    Given the command palette is open
    When the user runs the command "Marquer comme non lu"
    Then the open email is marked as unread
    And the command palette is closed

  @AC2
  Scenario: The applied action is announced to assistive technology
    Given the command palette is open
    When the user runs the command "Archiver"
    Then the action is announced in an aria-live region

  @AC2
  Scenario: The applied delete is announced to assistive technology
    Given the command palette is open
    When the user runs the command "Supprimer"
    Then the action is announced in an aria-live region

  @AC3
  Scenario: Each action has a test
    Given the scenarios of this feature
    Then there is a test for the command "Archiver"
    And there is a test for the command "Supprimer"
    And there is a test for the command "Favoris"
    And there is a test for the command "Marquer comme non lu"
