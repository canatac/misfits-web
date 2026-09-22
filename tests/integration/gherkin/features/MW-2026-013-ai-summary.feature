Feature: MW-2026-013 — AI email summary
  As a user
  I want to generate a summary of an email using AI
  So that I can quickly understand long emails without reading them fully

  Background:
    Given I am logged in as "qa.admin@misfits.fr"
    And I have an email with a body of 500+ words

  Scenario: AI summary button visible in email view
    When I open an email with body text
    Then I should see a "Summary" or "Résumé IA" button in the email toolbar

  Scenario: AI summary generates within 5 seconds
    Given I have an email open
    When I click "Résumé IA"
    Then a summary should be generated in under 5 seconds
    And the summary should be displayed in a side panel

  Scenario: Summary is contextually accurate
    Given an email about scheduling a meeting
    When I generate the summary
    Then the summary should mention the key points (date, time, attendees)

  Scenario: Summary panel can be dismissed
    Given the summary panel is visible
    When I close the panel
    Then it should collapse and the full email should be visible

  Scenario: AI offline indicator when service unavailable
    Given the AI service is unavailable
    When I click "Résumé IA"
    Then I should see an error or offline indicator
    And the email should remain readable
