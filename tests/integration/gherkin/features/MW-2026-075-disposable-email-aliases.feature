Feature: MW-2026-075 — Disposable email aliases
  As a privacy-conscious user
  I want to create disposable email aliases
  So that I can protect my real email address when signing up for services

  Background:
    Given the user is logged in to mail.misfits.ai
    And the user navigates to Settings > Email Aliases

  Scenario: Create a disposable alias
    When the user clicks "Create alias"
    Then a new alias is generated in the format "<random>@misfits.ai"
    And the alias appears in the aliases list
    And the alias status is "Active"

  Scenario: Receive email via alias
    Given an alias "xyz123@misfits.ai" exists and is active
    When an email is sent to "xyz123@misfits.ai"
    Then the email is redirected to the user's real inbox
    And the email appears in the unified inbox

  Scenario: Delete an alias
    Given an alias "xyz123@misfits.ai" exists
    When the user clicks "Delete" on the alias
    And confirms the deletion
    Then the alias is removed from the aliases list
    And emails sent to the alias are rejected with a bounce

  Scenario: API endpoint exists for alias creation
    When the user sends "POST /api/aliases"
    Then the response status is 201 or 401
    And the response body contains an "alias" field

  Scenario: API endpoint exists for alias deletion
    When the user sends "DELETE /api/aliases/xyz123"
    Then the response status is 200 or 401
