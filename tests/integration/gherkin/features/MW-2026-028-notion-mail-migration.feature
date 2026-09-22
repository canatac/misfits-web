Feature: MW-2026-028 — Notion Mail migration
  As a user
  I want to import emails from Notion Mail (Gmail sync)
  So that I can migrate my data to misfits.ai

  Background:
    Given I am logged in as "qa.admin@misfits.fr"
    And I navigate to the import wizard

  Scenario: Import wizard is accessible
    Then I should see an "Import" option in settings or onboarding
    And it should offer Notion Mail as a source

  Scenario: Gmail sync import flow
    When I select "Notion Mail" as the import source
    And I authenticate with Gmail
    Then the import wizard should start syncing emails
    And progress should be displayed

  Scenario: Imported emails appear in inbox
    When the import completes
    Then imported emails should appear in my inbox
    And snippets and templates should be migrated
    And auto-labels should be recreated
