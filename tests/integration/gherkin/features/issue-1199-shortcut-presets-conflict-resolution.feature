Feature: Shortcut presets replace redefined bindings and resolve conflicts
  Applying a preset replaces the bindings of the actions it redefines, so no action keeps two shortcuts and no shortcut is bound to two actions.

  @AC1
  Scenario: Applying a preset replaces the bindings of the actions it redefines
    Given the default shortcut bindings
    When I apply a preset
    Then the bindings of the actions it redefines are replaced
    And no action keeps two shortcuts

  @AC2
  Scenario: The Vim preset leaves Previous email and Star/Pin email one shortcut each
    Given the default shortcut bindings
    When I apply the Vim preset
    Then "Previous email" and "Star/Pin email" each have exactly one shortcut
    And no shortcut is bound to two actions

  @AC3
  Scenario: The Gmail preset leaves Reply to email and Archive email one shortcut each
    Given the default shortcut bindings
    When I apply the Gmail preset
    Then "Reply to email" and "Archive email" each have exactly one shortcut

  @AC4
  Scenario: A conflicting binding is never applied silently
    Given the default shortcut bindings
    When I apply a preset that conflicts with an existing binding
    Then the conflict is refused or resolved
    And the user is told

  @AC5
  Scenario: Each criterion has a test
    Given the acceptance criteria of issue #1199
    When the test suite runs
    Then each criterion has a test
