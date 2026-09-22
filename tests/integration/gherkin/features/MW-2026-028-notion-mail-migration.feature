Feature: MW-2026-028 — Notion Mail migration
  As a user
  I want to import my emails from Notion Mail (Gmail sync)
  So that I can migrate to misfits.ai without losing my data

  Background:
    Given I am logged in as "qa.admin@misfits.fr"
    And I have an existing Notion Mail account with emails, snippets, and templates

  Scenario: Migration wizard entry point
    When I navigate to Settings > Import
    Then I should see a "Notion Mail" import option
    And it should display the estimated import time

  Scenario: Gmail sync authorization for Notion Mail import
    When I click "Import from Notion Mail"
    Then I should be prompted to authorize Gmail access via OAuth
    And the authorization scope should include mail.readonly

  Scenario: Email import progress
    Given I have authorized Gmail access
    When I start the import
    Then I should see a progress bar with percentage
    And the imported emails should appear in my inbox in real-time

  Scenario: Snippets migration
    Given I have Notion Mail snippets
    When the import completes
    Then my snippets should be available in the composer snippet menu
    And each snippet should retain its original name and content

  Scenario: Templates migration
    Given I have Notion Mail templates
    When the import completes
    Then my templates should appear in the templates section
    And each template should retain formatting and variables

  Scenario: Auto-labels recreation
    Given I have Notion Mail auto-label rules
    When the import completes
    Then auto-labels should be recreated as misfits.ai labels
    And emails should be automatically labeled during import

  Scenario: Import completion summary
    When the import finishes
    Then I should see a summary with counts (emails, snippets, templates, labels)
    And a "View imported emails" button should be available

  Scenario: Import failure recovery
    Given the import is in progress
    When the connection drops
    Then the import should pause and offer a "Resume" option
    And no duplicate emails should be created on resume
