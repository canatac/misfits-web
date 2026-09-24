Feature: MW-2026-133 — Undo send with progress bar
  As a user
  I want a visual countdown during the undo-send window
  So that I know exactly how much time remains before my email is permanently sent

  Background:
    Given I am logged in as "qa.admin@misfits.fr"
    And I am on the compose page

  Scenario: Progress bar appears after sending an email
    When I compose an email to "test@example.com" with subject "Progress Bar Test"
    And I click "Send"
    Then I should see a progress bar within 2 seconds
    And the progress bar should have an aria-label containing the remaining time in seconds
    And the progress bar should transition from green to yellow to red over 5 seconds

  Scenario: Progress bar counts down from 5s to 0s
    Given I just sent an email
    Then the progress bar should show approximately 5 seconds remaining initially
    And the progress bar should decrease over time
    And the progress bar should disappear after 5 seconds

  Scenario: Clicking the progress bar cancels the send
    Given I just sent an email and the progress bar is visible
    When I click the progress bar
    Then the email should be recalled to "Drafts"
    And the progress bar should disappear
    And the email should not appear in "Sent"

  Scenario: Escape key triggers undo during progress
    Given I just sent an email and the progress bar is visible
    When I press "Escape"
    Then the email should be recalled to "Drafts"
    And the progress bar should disappear

  Scenario: Progress bar aria-label updates with countdown
    Given I just sent an email and the progress bar is visible
    Then the progress bar aria-label should contain "5" or "4" initially
    And after 2 seconds the aria-label should contain "3" or "2"

  Scenario: Production anonymous check — undo endpoint requires auth
    Given I am not authenticated
    When I send a GET request to "/api/compose/undo"
    Then the response status should be 404 or 401

  Scenario: POST /api/compose/undo with valid email ID recalls the email
    Given an email was just sent within the last 5 seconds
    When I send a POST request to "/api/compose/undo" with the email ID
    Then the response status should be 200
    And the email status should change to "draft"
