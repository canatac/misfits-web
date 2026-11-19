Feature: Command palette actions apply to the open email
  As a keyboard-first user
  I want the command palette action commands to act on the email I have open
  So that I can archive, delete, star or mark it unread without leaving the keyboard

  Background:
    Given the user is signed in
    And the inbox lists at least one email

  @AC1
  Scenario: Selecting the archive command applies the action to the open email
    Given the email is open
    When the user selects the archive command in the command palette
    Then the email is archived
    And the command palette closes

  @AC1
  Scenario: Selecting the delete command applies the action to the open email
    Given the email is open
    When the user selects the delete command in the command palette
    Then the email is deleted
    And the command palette closes

  @AC1
  Scenario: Selecting the star command applies the action to the open email
    Given the email is open
    When the user selects the star command in the command palette
    Then the email is starred
    And the command palette closes

  @AC1
  Scenario: Selecting the mark-unread command applies the action to the open email
    Given the email is open
    When the user selects the mark-unread command in the command palette
    Then the email is marked unread
    And the command palette closes

  @AC2
  Scenario: The result of an action command is announced to assistive technology
    Given the email is open
    When the user selects an action command in the command palette
    Then the result of the action is announced to assistive technology

  @AC3
  Scenario: The action commands are disabled when no email is open
    Given no email is open
    When the user opens the command palette
    Then the action commands are disabled

  @AC3
  Scenario: The action commands are hidden when no email is open
    Given no email is open
    When the user opens the command palette
    Then the action commands are hidden
