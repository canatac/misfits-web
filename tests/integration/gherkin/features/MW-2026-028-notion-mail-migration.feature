Feature: Notion Mail migration (MW-2026-028)
  As a user migrating from Notion Mail
  I want to import my emails, snippets, and templates
  So that I can seamlessly transition to misfits.ai with my data and auto-labels preserved

  Background:
    Given the production site "https://mail.misfits.ai" is reachable
    And the user is authenticated

  Scenario: Import wizard is accessible
    Given the user navigates to the import section
    Then a migration wizard is available for Notion Mail imports
    And the wizard supports Gmail sync as the import source

  Scenario: Emails are imported from Notion Mail
    Given the user initiates a Notion Mail import via Gmail sync
    When the import process completes
    Then all emails from the Notion Mail account are visible in the inbox
    And no emails are lost during migration

  Scenario: Snippets and templates are migrated
    Given the user has snippets and templates in Notion Mail
    When the import process completes
    Then all snippets are available in the misfits.ai composer
    And all templates are available in the template manager

  Scenario: Auto-labels are recreated
    Given the user has auto-label rules in Notion Mail
    When the import process completes
    Then equivalent label rules are recreated in misfits.ai
    And incoming emails are automatically labeled

  Scenario: Import endpoint requires authentication
    Given an unauthenticated request to the import API
    When the request is made to /api/import
    Then the response status is 401 or 307
    And no data is exposed to unauthenticated users
