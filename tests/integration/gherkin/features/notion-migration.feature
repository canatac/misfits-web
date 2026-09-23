Feature: Notion Mail migration wizard (MW-2026-080)
  As a user migrating from Notion Mail
  I want to import my emails, labels, templates, and auto-labels via a step-by-step wizard
  So that I can quickly set up my misfits.ai account with my existing data

  Background:
    Given the user is authenticated
    And the user opens the import settings page

  Scenario: Import wizard is accessible
    When I navigate to settings or import section
    Then a "Notion Mail" or "Import emails" option is visible
    When I click on the import option
    Then a migration wizard is displayed with step indicators

  Scenario: Import .eml files
    Given the migration wizard is open
    When I select "Import .eml files"
    And I upload a valid .eml file
    Then the file is parsed and emails are imported
    And a success count is displayed

  Scenario: Import labels
    Given the migration wizard is open
    When I select "Import labels"
    And I upload a labels configuration file
    Then labels are recreated in misfits.ai
    And imported emails are tagged with their original labels

  Scenario: Import templates
    Given the migration wizard is open
    When I select "Import templates"
    And I upload template files
    Then templates are available in the composer
    And template names and content are preserved

  Scenario: Recreate auto-labels
    Given the migration wizard is open
    When I select "Import auto-labels"
    And I upload auto-label rules
    Then auto-label rules are active
    And new incoming emails are auto-labeled

  Scenario: Import API endpoint requires authentication
    Given I am not authenticated
    When I send POST /api/import/notion
    Then the response status is 307 or 401
    And no import is processed

  Scenario: Import wizard shows progress
    Given the migration wizard is open
    And I have started an import
    Then a progress bar or status indicator is visible
    And the number of imported items is shown

  Scenario: Import completion confirmation
    Given the migration wizard has completed
    Then a confirmation message is displayed
    And a summary of imported items (emails, labels, templates, auto-labels) is shown
