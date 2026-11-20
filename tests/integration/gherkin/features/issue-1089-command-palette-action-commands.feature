Feature: Command palette action commands apply to the selected email
  In src/components/command-palette.tsx the commands "Archiver", "Supprimer",
  "Favoris" and "Marquer comme non lu" only close the palette
  (action: () => closePalette()). A keyboard-first user invokes them, sees the
  palette disappear and nothing happen: the email is not archived, deleted,
  starred or marked unread.

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
  Scenario: The archive action is announced to assistive technology
    When the user selects the "Archiver" command
    Then the result is announced to assistive technology

  @AC3
  Scenario: The delete action is announced to assistive technology
    When the user selects the "Supprimer" command
    Then the result is announced to assistive technology

  @AC3
  Scenario: The star action is announced to assistive technology
    When the user selects the "Favoris" command
    Then the result is announced to assistive technology

  @AC3
  Scenario: The mark-unread action is announced to assistive technology
    When the user selects the "Marquer comme non lu" command
    Then the result is announced to assistive technology

  @AC4
  Scenario: A test asserts the archive action is applied
    When the user selects the "Archiver" command
    Then a test asserts the archive action is applied to the selected email

  @AC4
  Scenario: A test asserts the delete action is applied
    When the user selects the "Supprimer" command
    Then a test asserts the delete action is applied to the selected email

  @AC4
  Scenario: A test asserts the star action is applied
    When the user selects the "Favoris" command
    Then a test asserts the star action is applied to the selected email

  @AC4
  Scenario: A test asserts the mark-unread action is applied
    When the user selects the "Marquer comme non lu" command
    Then a test asserts the mark-unread action is applied to the selected email
