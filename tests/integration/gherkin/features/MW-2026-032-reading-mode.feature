Feature: MW-2026-032 — Reading Mode
  As a user reading emails,
  I want a distraction-free reading mode that sanitizes HTML content
  So that I can focus on the email content without clutter.

  Background:
    Given I am logged in to https://mail.misfits.ai as admin
    And I have at least one email in my inbox

  Scenario: Reading mode toggle button is visible in email toolbar
    When I open an email from the inbox
    Then I should see a "Reading mode" toggle button in the email toolbar
    And the button should have aria-label "Mode lecture immersive"

  Scenario: Activating reading mode via button click
    Given I am viewing an email
    When I click the "Reading mode" toggle button
    Then a reading mode banner "Mode lecture immersive" should appear at the top
    And the email content should switch to reading view
    And the HTML content should be sanitized

  Scenario: Activating reading mode via keyboard shortcut
    Given I am viewing an email
    When I press Ctrl+Shift+R
    Then a reading mode banner "Mode lecture immersive" should appear at the top

  Scenario: Reading progress bar is visible in reading mode
    Given I have activated reading mode
    When I scroll through the email content
    Then a reading progress bar should be visible at the bottom of the screen

  Scenario: Deactivating reading mode
    Given I have activated reading mode
    When I click the exit button in the reading mode banner
    Then the reading mode banner should disappear
    And the email should return to normal view

  Scenario: Reading mode preference persists across sessions
    Given I have activated reading mode
    When I reload the page
    Then reading mode should still be active
