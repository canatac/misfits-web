Feature: Command palette message actions
  A keyboard-first user opens the command palette with a message selected and
  picks Archiver, Supprimer, Favoris or Marquer comme non lu: the palette closes
  and nothing happens to the message. The journey stops at a dead end and the
  user must leave the keyboard and use the list toolbar.

  Background:
    Given the command palette is open
    And an email is currently selected

  @AC1
  Scenario: Selecting the archive command applies the action to the selected email
    When the user selects the "Archiver" command
    Then the archive action is applied to the selected email

  @AC1
  Scenario: Selecting the delete command applies the action to the selected email
    When the user selects the "Supprimer" command
    Then the delete action is applied to the selected email

  @AC1
  Scenario: Selecting the star command applies the action to the selected email
    When the user selects the "Favoris" command
    Then the star action is applied to the selected email

  @AC1
  Scenario: Selecting the mark-unread command applies the action to the selected email
    When the user selects the "Marquer comme non lu" command
    Then the mark-unread action is applied to the selected email

  @AC2
  Scenario: The palette closes only after the archive action is applied
    When the user selects the "Archiver" command
    Then the archive action is applied to the selected email
    And the command palette is closed

  @AC2
  Scenario: The palette closes only after the delete action is applied
    When the user selects the "Supprimer" command
    Then the delete action is applied to the selected email
    And the command palette is closed

  @AC2
  Scenario: The palette closes only after the star action is applied
    When the user selects the "Favoris" command
    Then the star action is applied to the selected email
    And the command palette is closed

  @AC2
  Scenario: The palette closes only after the mark-unread action is applied
    When the user selects the "Marquer comme non lu" command
    Then the mark-unread action is applied to the selected email
    And the command palette is closed

  @AC3
  Scenario: The result of the archive action is announced to screen readers
    When the user selects the "Archiver" command
    Then the result is announced to screen readers

  @AC3
  Scenario: The result of the delete action is announced to screen readers
    When the user selects the "Supprimer" command
    Then the result is announced to screen readers

  @AC3
  Scenario: The result of the star action is announced to screen readers
    When the user selects the "Favoris" command
    Then the result is announced to screen readers

  @AC3
  Scenario: The result of the mark-unread action is announced to screen readers
    When the user selects the "Marquer comme non lu" command
    Then the result is announced to screen readers

  @AC3
  Scenario: The delete action of the palette is undoable like the delete of the list
    When the user selects the "Supprimer" command
    Then the delete action is undoable like the same action in the list

  @AC4
  Scenario: A test covers the archive action from the palette
    When the user selects the "Archiver" command
    Then a test covers the archive action from the palette

  @AC4
  Scenario: A test covers the delete action from the palette
    When the user selects the "Supprimer" command
    Then a test covers the delete action from the palette

  @AC4
  Scenario: A test covers the star action from the palette
    When the user selects the "Favoris" command
    Then a test covers the star action from the palette

  @AC4
  Scenario: A test covers the mark-unread action from the palette
    When the user selects the "Marquer comme non lu" command
    Then a test covers the mark-unread action from the palette
