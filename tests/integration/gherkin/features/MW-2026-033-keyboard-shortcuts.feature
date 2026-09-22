Feature: MW-2026-033 — Keyboard shortcuts
  As a power user
  I want to navigate and act on emails using keyboard shortcuts
  So that I can work faster without reaching for the mouse

  Background:
    Given the misfits-mail application is running at "https://mail.misfits.ai"
    And I am authenticated as admin
    And no input, textarea, or contenteditable element is focused

  Scenario: Pressing "c" opens the compose view
    When I press the key "c"
    Then the compose view should open

  Scenario: Pressing "j" navigates to next email
    When I press the key "j"
    Then the next email in the list should be selected

  Scenario: Pressing "k" navigates to previous email
    When I press the key "k"
    Then the previous email in the list should be selected

  Scenario: Pressing "e" archives the selected email
    When I press the key "e"
    Then the selected email should be archived

  Scenario: Pressing "#" deletes the selected email
    When I press the key "#"
    Then the selected email should be deleted

  Scenario: Pressing "/" focuses the search field
    When I press the key "/"
    Then the search input should be focused

  Scenario: Pressing "Escape" closes overlays or exits
    When I press the key "Escape"
    Then any open overlay or modal should be closed

  Scenario: Pressing "Ctrl+/" shows keyboard shortcuts help
    When I press the keys "Control" and "/"
    Then the keyboard shortcuts help modal should be displayed

  Scenario: Pressing "Ctrl+K" opens command palette
    When I press the keys "Control" and "k"
    Then the command palette or search should be focused

  Scenario: Pressing "s" toggles star on selected email
    When I press the key "s"
    Then the selected email should be starred or unstarred

  Scenario: Pressing "u" marks email as unread
    When I press the key "u"
    Then the selected email should be marked as unread

  Scenario: Shortcuts are disabled while typing in input
    Given an input field is focused
    When I press the key "c"
    Then the compose view should NOT open
    And the character "c" should appear in the input
