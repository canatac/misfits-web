Feature: MW-2026-032 — Reading mode
  As a user
  I want to activate a distraction-free reading mode on an email
  So that I can read without visual clutter and with sanitized HTML

  Background:
    Given I am logged in as "qa.admin@misfits.fr"
    And I am on the email view page

  Scenario: Reading mode button is visible in email view
    Then I should see a "Reading mode" or "Focus mode" button in the email toolbar

  Scenario: Activating reading mode sanitizes HTML content
    When I click "Reading mode"
    Then the email content should be displayed in a clean reading view
    And potentially dangerous HTML elements should be sanitized (scripts, iframes)
    And a "Exit reading mode" button should be visible

  Scenario: Exiting reading mode returns to normal view
    Given I am in reading mode
    When I click "Exit reading mode"
    Then the email should return to the standard email view
