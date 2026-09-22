Feature: MW-2026-028 — Notion Mail migration wizard
  As a user migrating from Notion Mail
  I want to import my emails, labels, templates, and rules into misfits.ai
  So that I can continue my workflow without losing data

  Background:
    Given I am logged in as "qa.admin@misfits.fr"
    And I am on the settings page

  Scenario: Migration wizard entry point is visible
    When I navigate to the "Import" or "Migration" section
    Then I should see a "Migrate from Notion Mail" option or banner

  Scenario: OAuth connection to Gmail account
    When I click "Connect Gmail account"
    Then I should be redirected to the Google OAuth consent screen
    And the OAuth scope should include "gmail.readonly" and "gmail.modify"

  Scenario: Email import with progress indicator
    Given I have connected my Gmail account
    When I start the email import
    Then I should see a progress bar or percentage indicator
    And the import should process in batches of 100 emails

  Scenario: Label migration
    Given I have Gmail labels "Work", "Personal", "Newsletters"
    When the migration completes
    Then corresponding folders or tags should exist in misfits.ai

  Scenario: Template migration
    Given I have Notion Mail snippets "Thank you", "Follow up", "Meeting notes"
    When the migration completes
    Then these should appear in the misfits.ai templates list

  Scenario: Migration report
    Given the migration has finished
    Then I should see a report with "imported", "skipped", and "failed" counts

  Scenario: Rollback option
    Given I have completed a migration
    When I click "Disconnect account" or "Remove imported data"
    Then the imported data should be removed
    And the external account should be disconnected
