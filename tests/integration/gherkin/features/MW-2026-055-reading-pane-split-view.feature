Feature: MW-2026-055 — Reading pane split-view
  As a user
  I want to see a split-view with email list on the left and email content on the right
  So that I can browse emails and read them simultaneously without losing context

  Background:
    Given I am logged in as admin on "https://mail.misfits.ai"
    And I am on the inbox page "/mail"
    And at least one email is visible in the inbox

  Scenario: Split-view layout is active by default
    When I open the inbox
    Then the email list should be visible on the left side (approximately 50% width)
    And the reading pane should be visible on the right side (approximately 50% width)

  Scenario: Clicking an email opens it in the reading pane
    When I click on an email in the left list
    Then the email content should be displayed in the right reading pane
    And the email list should remain visible on the left

  Scenario: Reading pane shows email content
    When I select an email from the list
    Then the email subject should be visible in the reading pane
    And the email body should be visible in the reading pane
    And the sender information should be visible

  Scenario: Escape key closes the reading pane on mobile
    When I am in mobile view
    And I open an email in the overlay reading pane
    And I press the Escape key
    Then the reading pane overlay should close
    And the full inbox list should be visible again

  Scenario: Mobile view shows overlay reading pane
    When I am in mobile viewport (< 768px)
    And I click an email in the list
    Then the reading pane should open as a full-screen overlay
    And a close button should be visible

  Scenario: Multiple email selection updates reading pane
    When I click email A in the list
    Then email A content is shown in the reading pane
    When I then click email B in the list
    Then email B content replaces email A in the reading pane
    And the list scroll position is preserved

  Scenario: Empty state when no email is selected
    When the inbox loads with no email pre-selected
    Then the reading pane should show an empty state or prompt
    And the email list should be fully visible
