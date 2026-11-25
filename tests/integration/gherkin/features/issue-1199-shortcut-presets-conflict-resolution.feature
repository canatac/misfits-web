Feature: Shortcut presets conflict resolution
  As a user of misfits.ai Mail
  I want to apply keyboard shortcut presets without conflicts
  So that each action has exactly one shortcut and no shortcut is bound to multiple actions

  @AC1
  Scenario: Applying a preset replaces existing bindings for redefined actions
    Given the default bindings are loaded in src/lib/shortcuts.ts
    When I apply the Vim preset
    Then the "Previous email" action should have only the preset shortcut "p"
    And the default shortcut "k" for "Previous email" should be removed

  @AC2
  Scenario: Vim preset ensures no duplicate bindings
    Given the default bindings are loaded
    When I apply the Vim preset
    Then "Previous email" should have exactly one shortcut
    And "Star/Pin email" should have exactly one shortcut
    And no shortcut should be bound to more than one action

  @AC3
  Scenario: Gmail preset ensures no duplicate bindings
    Given the default bindings are loaded
    When I apply the Gmail preset
    Then "Reply to email" should have exactly one shortcut
    And "Archive email" should have exactly one shortcut

  @AC4
  Scenario: Conflicting bindings are not applied silently
    Given the default bindings are loaded
    When I attempt to apply a preset that would create a conflict
    Then the conflicting binding should be refused
    Or the conflict should be resolved automatically
    And I should be informed of the conflict resolution

  @AC5
  Scenario: Each acceptance criterion has a test
    Given the test suite is set up
    When I run the tests for shortcut presets
    Then there should be a test for AC1
    And there should be a test for AC2
    And there should be a test for AC3
    And there should be a test for AC4
    And there should be a test for AC5