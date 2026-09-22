Feature: MW-2026-003 — Undo send (5-second recall window)
  As a user
  I want to recall an email within 5 seconds of sending
  So that I can fix mistakes immediately

  Background:
    Given I am logged in as "qa.admin@misfits.fr"
    And I am on the compose page

  Scenario: Undo button appears after sending
    When I compose an email to "test@example.com" with subject "Undo Test"
    And I click "Send"
    Then I should see an "Undo" button within 5 seconds
    And a toast notification with undo action should be visible

  Scenario: Undo recalls the email from outbox
    Given I just sent an email
    When I click "Undo" within 5 seconds
    Then the email should be moved to "Drafts"
    And it should not appear in "Sent"
    And the email should be removed from the outbox

  Scenario: Undo window expires after 5 seconds
    Given I sent an email 10 seconds ago
    Then I should not see an "Undo" button
    And the email should remain in "Sent"

  Scenario: Ctrl+Z keyboard shortcut triggers undo
    Given I just sent an email within the last 5 seconds
    When I press "Ctrl+Z"
    Then the email should be recalled to "Drafts"

  Scenario: POST /api/compose/undo endpoint exists
    Given an email was just sent
    When I send a POST request to "/api/compose/undo" with the email ID
    Then the response status should be 200
    And the email status should change to "draft"

  Scenario: Production anonymous check — undo endpoint absent
    Given I am not authenticated
    When I send a GET request to "/api/compose/undo"
    Then the response status should be 404 or 401
