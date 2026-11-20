Feature: Command palette action commands apply to the selected email
  The command palette lists archive, delete, star and mark-unread commands.
  A keyboard-first user who invokes them must act on the currently selected email,
  see the list reflect the change, hear the result, and be able to undo a delete.

  Background:
    Given the command palette is open
    And an email is currently selected

  @AC1
  Scenario: Selecting the archive command applies the action to the selected email
    When the user selects the "Archiver" command
    Then the archive action is applied to the selected email
    And the command palette is closed

  @AC1
  Scenario: Selecting the delete command applies the action to the selected email
    When the user selects the "Supprimer" command
    Then the delete action is applied to the selected email
    And the command palette is closed

  @AC1
  Scenario: Selecting the star command applies the action to the selected email
    When the user selects the "Favoris" command
    Then the star action is applied to the selected email
    And the command palette is closed

  @AC1
  Scenario: Selecting the mark-unread command applies the action to the selected email
    When the user selects the "Marquer comme non lu" command
    Then the mark-unread action is applied to the selected email
    And the command palette is closed

  @AC2
  Scenario: The list reflects the mark-unread change without a manual refresh
    When the user selects the "Marquer comme non lu" command
    Then the list reflects the unread state of the selected email without a manual refresh

  @AC2
  Scenario: The list reflects the star change without a manual refresh
    When the user selects the "Favoris" command
    Then the list reflects the star of the selected email without a manual refresh

  @AC2
  Scenario: The list reflects the removal from the inbox without a manual refresh
    When the user selects the "Archiver" command
    Then the list reflects the removal of the selected email from the inbox without a manual refresh

  @AC3
  Scenario: The result of an action command is announced to assistive technology
    When the user selects the "Favoris" command
    Then the result is announced to assistive technology

  @AC3
  Scenario: The result of the delete command is announced to assistive technology
    When the user selects the "Supprimer" command
    Then the result is announced to assistive technology

  @AC4
  Scenario: The delete command is undoable like its toolbar equivalent
    When the user selects the "Supprimer" command
    Then the destructive delete action is undoable like its toolbar equivalent
