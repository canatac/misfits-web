Feature: MW-2026-056 — Reading mode integration in email-view
  As a user reading emails
  I want to activate a distraction-free reading mode when viewing an email
  So that I can focus on the email content without UI clutter

  Background:
    Given I am logged in as admin on "https://mail.misfits.ai"
    And I am on the inbox page "/mail"
    And I open an email with HTML content

  Scenario: Reading mode can be activated from email view
    When I click the "Reading mode" button in the email view toolbar
    Then the email view should switch to reading mode
    And the sidebar and navigation should be hidden
    And the email content should be displayed in a clean, centered layout

  Scenario: Reading mode sanitizes HTML content
    When I activate reading mode on an email with HTML content
    Then the HTML content should be sanitized (scripts removed, styles cleaned)
    And the content should be displayed in a readable font with adequate line spacing

  Scenario: Reading mode has a visible disable button
    When reading mode is active
    Then a "Exit reading mode" button should be visible
    And clicking it should return to the normal email view

  Scenario: Reading mode keyboard shortcut
    When I press the "R" key while viewing an email
    Then reading mode should toggle on/off

  Scenario: Reading mode persists during email navigation
    When I activate reading mode
    And I navigate to the next email
    Then reading mode should remain active for the new email

  Scenario: Reading mode formatting options
    When reading mode is active
    Then I should be able to adjust text size (increase/decrease)
    And the background should switch between light/dark/sepia themes
