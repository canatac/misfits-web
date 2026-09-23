Feature: Disposable email aliases (MW-2026-075, MW-2026-076)
  As a privacy-conscious user
  I want to create disposable email aliases
  So that I can protect my real email address when signing up for services

  Background:
    Given the user is authenticated
    And the settings page has an "Aliases" section

  Scenario: Create a disposable alias
    When I navigate to Settings > Aliases
    And I click "Create alias"
    And I enter a prefix "newservice2026"
    Then an alias "newservice2026@misfits.ai" is created
    And it appears in my aliases list with status "active"

  Scenario: Emails received via alias redirect to real inbox
    Given I have an alias "shop@misfits.ai"
    When someone sends an email to "shop@misfits.ai"
    Then the email appears in my unified inbox
    And the "Via alias: shop@misfits.ai" indicator is shown

  Scenario: Disable an alias when receiving spam
    Given I have an alias "spammy@misfits.ai" that receives spam
    When I click "Disable" on the alias
    Then the alias status changes to "disabled"
    And emails to "spammy@misfits.ai" are rejected with "address inactive"

  Scenario: Delete an alias permanently
    Given I have an alias "old@misfits.ai"
    When I click "Delete" on the alias
    And I confirm the deletion
    Then the alias is removed from my list
    And emails to "old@misfits.ai" bounce with "address not found"

  Scenario: View service log per alias
    Given I have an alias "social@misfits.ai"
    When I click on the alias details
    Then I see a list of services that received this alias
    And each entry shows the date the alias was shared

  Scenario: Security — alias API requires authentication
    Given I am not authenticated
    When I send POST /api/aliases/create
    Then the response status is 307 or 401
    And no alias is created
