Feature: Command palette action commands
  The command palette lists archive, delete, star and mark-unread commands.
  A keyboard-first user who invokes them must act on the currently selected email
  and hear the result through an aria-live region.

  Background:
    Given the command palette is open
    And an email is currently selected

  @AC1
  Scenario: The archive command archives the selected email and announces the result
    When the user selects the archive command
    Then the selected email is archived
    And the result of the archive is announced

  @AC1
  Scenario: The delete command deletes the selected email and announces the result
    When the user selects the delete command
    Then the selected email is deleted
    And the result of the delete is announced

  @AC2
  Scenario: The star command toggles the star of the selected email
    When the user selects the star command
    Then the star of the selected email is toggled

  @AC3
  Scenario: The mark-unread command marks the selected email as unread
    When the user selects the mark-unread command
    Then the selected email is marked as unread

  @AC4
  Scenario: Each command reports its outcome through an aria-live region
    When the user selects the archive command
    Then the outcome of the command is reported through an aria-live region

  @AC4
  Scenario: The delete outcome is reported through an aria-live region
    When the user selects the delete command
    Then the outcome of the delete is reported through an aria-live region
