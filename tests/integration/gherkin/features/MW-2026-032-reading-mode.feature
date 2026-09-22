Feature: MW-2026-032 — Reading mode for emails
  As a user
  I want to activate a reading mode on an email
  So that I can read the content in a clean, distraction-free view with sanitized HTML

  Background:
    Given I am logged in as admin on "https://mail.misfits.ai"
    And I am on the inbox page "/mail"
    And at least one email is visible in the inbox

  Scenario: Reading mode button is visible on email view
    When I open an email from the inbox
    Then a reading mode toggle button should be visible in the email toolbar

  Scenario: Activating reading mode changes the view
    When I open an email
    And I click the reading mode button
    Then the email content should switch to a clean reading view
    And the view should have a visible reading mode indicator

  Scenario: HTML content is sanitized in reading mode
    When I open an email with HTML content
    And I activate reading mode
    Then the HTML content should be sanitized (no scripts, no external resources)
    And the text content should remain readable

  Scenario: Deactivation bar is visible in reading mode
    When I activate reading mode on an email
    Then a deactivation bar or button should be visible
    And clicking it should return to the normal email view

  Scenario: Reading mode works on plain text emails
    When I open a plain text email
    And I activate reading mode
    Then the email content should be displayed in the reading view
    And no formatting errors should occur

  Scenario: Reading mode preserves email metadata
    When I open an email with sender, subject, and date
    And I activate reading mode
    Then the sender name should still be visible
    And the subject should still be visible

  Scenario: Exit reading mode returns to normal view
    When I activate reading mode on an email
    And I click the exit/deactivate button
    Then the normal email view should be restored
    And the full email toolbar should be visible again
