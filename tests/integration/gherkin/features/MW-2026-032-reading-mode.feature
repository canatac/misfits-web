Feature: MW-2026-032 — Reading mode
  As a user
  I want to activate a reading mode on an email
  So that I can read emails in a clean, distraction-free view with sanitized HTML

  Background:
    Given I am logged in as "qa.admin@misfits.fr"
    And I am viewing an email in the mail reader

  Scenario: Reading mode toggle is visible in email toolbar
    Then I should see a "Reading mode" or "Focus mode" toggle button in the email toolbar

  Scenario: Activating reading mode sanitizes HTML content
    When I click the "Reading mode" toggle
    Then the email content area should switch to reading mode
    And the HTML content should be sanitized (no scripts, no external images loaded automatically)
    And a reading mode indicator bar should be visible

  Scenario: Deactivation bar visible in reading mode
    Given I have activated reading mode
    Then I should see a deactivation bar at the top or bottom of the reading view
    And clicking it should return to the normal email view

  Scenario: Reading mode persists during email navigation
    Given I have activated reading mode
    When I navigate to the next email in the thread
    Then reading mode should remain active
