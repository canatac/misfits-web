Feature: MW-2026-067 — Composer unsaved changes indicator
  As a user composing an email
  I want a visual indicator when I have unsaved changes in the composer
  So that I don't lose my work by accidentally navigating away

  Background:
    Given the production server "https://mail.misfits.ai" is reachable
    And the user is authenticated

  Scenario: Unsaved changes indicator appears after typing
    When the user opens the composer
    And the user types text in the body
    Then an unsaved changes indicator should be visible
    And the indicator should show the draft status

  Scenario: Navigation warning when unsaved changes exist
    When the user has typed content in the composer
    And the user attempts to navigate away
    Then a warning dialog should be displayed
    And the dialog should offer to save as draft or discard

  Scenario: Auto-save draft after inactivity
    When the user has typed content in the composer
    And the user is inactive for 10 seconds
    Then the draft should be auto-saved
    And a "Draft saved" notification should appear

  Scenario: Indicator clears after save or send
    When the user has unsaved changes indicated
    And the user saves as draft or sends the email
    Then the unsaved changes indicator should disappear

  Scenario: Composer empty state has no indicator
    When the user opens a blank composer
    Then no unsaved changes indicator should be visible
