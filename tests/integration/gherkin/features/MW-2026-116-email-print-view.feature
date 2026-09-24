Feature: MW-2026-116 — Email print view with clean formatting + print-to-PDF
  As a user reading an email
  I want to print the email with clean formatting
  So that I can have a paper copy or PDF archive

  Background:
    Given I am logged in as admin on "https://mail.misfits.ai"
    And I am on the inbox page "/mail"

  Scenario: Print button is visible in email toolbar
    When I open an email
    Then a print button should be visible in the email toolbar or action bar

  Scenario: Print button triggers browser print dialog
    When I open an email
    And I click the print button
    Then the browser print dialog should be triggered
    Or a print-optimized view should open

  Scenario: Print view shows email metadata
    When I open the print view for an email
    Then the email metadata should be visible including from, to, date, and subject
    And the email body content should be visible

  Scenario: Print view hides UI chrome
    When I open the print view
    Then navigation bars and sidebars should be hidden
    And only the email content and metadata should be visible
