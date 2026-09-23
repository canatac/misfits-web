Feature: MW-2026-080 — Notion Mail migration wizard
  As a user migrating from Notion Mail
  I want to import my emails, snippets, templates, and auto-labels
  So that I can seamlessly continue using misfits.ai with my existing data

  Background:
    Given I am logged in as admin on "https://mail.misfits.ai"
    And I am on the inbox page "/mail"

  Scenario: Migration wizard is accessible from settings
    When I navigate to the settings or import page
    Then a "Notion Mail" migration option should be visible

  Scenario: Migration wizard starts with Gmail sync authentication
    When I click on "Import from Notion Mail"
    Then a migration wizard should start
    And it should prompt me to authenticate with my Gmail account (Notion Mail sync source)

  Scenario: Emails are imported after authentication
    When I authenticate with Gmail in the migration wizard
    Then emails should start importing
    And a progress indicator should show the import status
    And imported emails should appear in the inbox

  Scenario: Snippets are migrated
    When I complete a Notion Mail import
    Then existing snippets from Notion Mail should be available in the snippets manager
    And snippets should be editable

  Templates are migrated
    When I complete a Notion Mail import
    Then email templates from Notion Mail should be available in the templates menu
    And templates should be usable in the composer

  Scenario: Auto-labels are recreated
    When I complete a Notion Mail import
    Then auto-labeling rules from Notion Mail should be recreated
    And new emails should be automatically labeled according to these rules

  Scenario: Migration progress is shown
    When I start a Notion Mail import
    Then a progress bar or status indicator should be displayed
    And the status should update as emails, snippets, templates, and labels are imported
