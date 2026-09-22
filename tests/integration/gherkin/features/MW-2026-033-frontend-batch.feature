Feature: MW-2026-033 — Frontend feature batch (P1)
  As a user
  I want all P1 frontend features to be implemented
  So that I have a complete email client experience

  Background:
    Given I am logged in as "qa.admin@misfits.fr"
    And I am on the mail dashboard

  Scenario: All P1 features are accessible
    Then all P1 features from the UX proposal batch should be accessible
    And each feature should have passing Gherkin tests
    And each feature should have a working API endpoint

  Scenario: Feature parity with Gherkin specs
    When I review the feature list
    Then every feature marked P1 should be functional in production
