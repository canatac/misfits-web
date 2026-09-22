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

  Scenario: Undo recalls the email
    Given I just sent an email
    When I click "Undo" within 5 seconds
    Then the email should be moved to "Drafts"
    And it should not appear in "Sent"

  Scenario: Undo window expires after 5 seconds
    Given I sent an email 10 seconds ago
    Then I should not see an "Undo" button
