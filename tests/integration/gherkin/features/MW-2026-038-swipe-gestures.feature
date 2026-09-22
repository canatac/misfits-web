Feature: MW-2026-038 — Email triage swipe gestures
  As a user
  I want to swipe left/right on emails in the list
  So that I can quickly archive or mark emails as read

  Background:
    Given I am logged in as "qa.admin@misfits.fr"
    And I am viewing the email list

  Scenario: Swipe left archives email
    When I swipe left on an email in the list
    Then the email should be archived
    And an undo option should be briefly visible

  Scenario: Swipe right marks as read
    When I swipe right on an unread email in the list
    Then the email should be marked as read
    And a visual confirmation should appear

  Scenario: Swipe animation is fluid
    When I perform a swipe gesture on an email
    Then the animation should be smooth (60fps)
    And the email should follow finger/cursor position

  Scenario: Swipe undo
    When I swipe to archive an email
    And I click "Undo" within 5 seconds
    Then the email should return to the inbox list
