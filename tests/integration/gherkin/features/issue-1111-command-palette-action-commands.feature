Feature: Command palette action commands act on the selected email
  The command palette lists the message actions "Archiver", "Supprimer", "Favoris" and "Marquer comme non lu". Today they only close the palette: the selected email is unchanged and the user believes the action was applied. The actions must apply to the selected email, announce the result to assistive technology, and be disabled or hidden when no email is selected.

  Background:
    Given the user is signed in with at least one email in the inbox
    And the command palette is opened from the inbox

  @AC1
  Scenario: Selecting the archive command applies the action to the selected email
    Given the email is selected in the inbox
    When the user selects the action command "Archiver" in the command palette
    Then the action is applied to the selected email
    And the email is archived

  @AC1
  Scenario: Selecting the delete command applies the action to the selected email
    Given the email is selected in the inbox
    When the user selects the action command "Supprimer" in the command palette
    Then the action is applied to the selected email
    And the email is deleted

  @AC1
  Scenario: Selecting the star command applies the action to the selected email
    Given the email is selected in the inbox
    When the user selects the action command "Favoris" in the command palette
    Then the action is applied to the selected email
    And the email is starred

  @AC1
  Scenario: Selecting the mark-unread command applies the action to the selected email
    Given the email is selected in the inbox
    When the user selects the action command "Marquer comme non lu" in the command palette
    Then the action is applied to the selected email
    And the email is marked as unread

  @AC2
  Scenario: The result of an action command is announced to assistive technology
    Given the email is selected in the inbox
    And an aria-live region is present in the command palette
    When the user selects the action command "Archiver" in the command palette
    Then the result of the action is announced in the aria-live region

  @AC2
  Scenario: The result of the delete command is announced to assistive technology
    Given the email is selected in the inbox
    And an aria-live region is present in the command palette
    When the user selects the action command "Supprimer" in the command palette
    Then the result of the action is announced in the aria-live region

  @AC3
  Scenario: The action commands are disabled when no email is selected
    Given no email is selected in the inbox
    When the user opens the command palette
    Then the action commands "Archiver", "Supprimer", "Favoris" and "Marquer comme non lu" are disabled or hidden

  @AC3
  Scenario: The action commands are hidden when no email is selected
    Given no email is selected in the inbox
    When the user opens the command palette
    Then the action commands "Archiver", "Supprimer", "Favoris" and "Marquer comme non lu" are hidden from the palette
