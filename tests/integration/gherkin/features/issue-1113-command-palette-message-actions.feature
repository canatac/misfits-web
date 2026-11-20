Feature: Command palette message actions
  A keyboard-first user opens the command palette with a message selected and
  applies an action from the palette: the action is applied to the selected
  email, the palette closes only after it, and the result is announced.

  Background:
    Given an email is selected in the inbox
    And the command palette is open

  @AC1
  Scenario: Selecting the archive command archives the selected email
    When I select the archive command
    Then the selected email is archived

  @AC1
  Scenario: Selecting the delete command deletes the selected email
    When I select the delete command
    Then the selected email is deleted

  @AC1
  Scenario: Selecting the star command stars the selected email
    When I select the star command
    Then the selected email is starred

  @AC1
  Scenario: Selecting the mark-unread command marks the selected email as unread
    When I select the mark-unread command
    Then the selected email is marked as unread

  @AC2
  Scenario: The palette closes only after the action is applied
    When I select the archive command
    Then the selected email is archived before the palette closes

  @AC3
  Scenario: The result of an action command is announced to screen readers
    When I select the star command
    Then the result of the action is announced to assistive technology

  @AC3
  Scenario: The delete command is undoable like the same action in the list
    When I select the delete command
    Then the deletion can be undone like the same action in the list
