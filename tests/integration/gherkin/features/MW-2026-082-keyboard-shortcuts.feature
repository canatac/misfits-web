Feature: MW-2026-082 — Keyboard shortcuts system
  As a power user
  I want to use keyboard shortcuts to navigate and perform actions
  So that I can work faster without using the mouse

  Background:
    Given I am logged in as admin on "https://mail.misfits.ai"
    And I am on the inbox page "/mail"
    And the inbox contains at least 1 email

  Scenario: Pressing C opens the composer
    When I press the "C" key while in the inbox
    Then the email composer should open
    And the composer should be ready to write a new email

  Scenario: Pressing Ctrl+/ shows keyboard shortcuts help panel
    When I press "Control" + "/" keys simultaneously
    Then a help panel showing available keyboard shortcuts should appear
    And the panel should list at least: C (compose), / (search), # (delete), E (archive)

  Scenario: Keyboard shortcuts help panel shows tooltips
    When I press "Control" + "/" keys simultaneously
    Then each shortcut should display a tooltip describing its action
    And tooltips should be visible and readable

  Scenario: Pressing Escape closes the help panel
    When I press "Control" + "/" keys simultaneously
    And I press the "Escape" key
    Then the keyboard shortcuts help panel should close

  Scenario: Pressing # deletes selected email
    When I select an email in the inbox
    And I press the "#" key
    Then the selected email should move to Trash
    And a confirmation or undo option should appear

  Scenario: Pressing E archives selected email
    When I select an email in the inbox
    And I press the "E" key
    Then the selected email should move to Archive

  Scenario: Pressing / focuses the search bar
    When I press the "/" key
    Then the search input should be focused
    And the cursor should be in the search field

  Scenario: Shortcuts do not trigger while typing in an input
    When I open the composer
    And I click on the "To" field
    And I type "C" in the recipient field
    Then the composer should NOT open a new compose window
    And the letter "C" should appear in the recipient field
