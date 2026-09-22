Feature: MW-2026-032 — Reading mode for distraction-free email reading
  As a user
  I want to activate a reading mode on an email
  So that I can read without distractions with sanitized HTML content

  Background:
    Given I am logged in as admin on "https://mail.misfits.ai"
    And I am on the inbox page "/mail"
    And at least one email is visible in the inbox

  Scenario: Reading mode toggle is visible in email toolbar
    When I open an email from the inbox
    Then a "Reading mode" toggle button should be visible in the email toolbar

  Scenario: Activating reading mode shows reading view
    Given I have opened an email
    When I click the "Reading mode" toggle button
    Then the email content should switch to reading view
    And a reading progress bar should be visible at the top
    And the reading mode activation banner should appear

  Scenario: HTML content is sanitized in reading mode
    Given I have opened an email with HTML content
    When I activate reading mode
    Then the HTML content should be sanitized (no scripts, no external images)
    And the text content should be displayed in a readable format

  Scenario: Deactivation bar is visible when reading mode is active
    Given reading mode is active
    Then a deactivation bar should be visible at the bottom of the screen
    And the bar should contain a "Quit reading mode" button

  Scenario: Keyboard shortcut toggles reading mode
    Given I have opened an email
    When I press Ctrl+Shift+R
    Then reading mode should be toggled on or off

  Scenario: Reading progress tracks scroll position
    Given reading mode is active
    When I scroll through the email content
    Then the reading progress bar should update based on scroll position

  Scenario: Closing reading mode returns to normal view
    Given reading mode is active
    When I click the "Quit reading mode" button or press Escape
    Then reading mode should be deactivated
    And the email should return to its normal view
