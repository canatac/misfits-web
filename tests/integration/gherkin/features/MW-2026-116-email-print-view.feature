Feature: MW-2026-116 — Email print view with clean formatting and print-to-PDF
  As a user reading an email
  I want to print the email or export it as PDF
  So that I have a clean, formatted copy without UI chrome

  Background:
    Given I am logged in as admin on "https://mail.misfits.ai"
    And I am on the inbox page "/mail"

  Scenario: Print view button is visible when reading an email
    When I open an email from the inbox
    Then a "Print" button or icon should be visible in the email toolbar

  Scenario: Print view opens with clean formatting
    When I open an email from the inbox
    And I click the "Print" button
    Then a print-optimized view should open
    And the view should not show the navigation sidebar
    And the view should not show the top toolbar
    And the email content should be clearly formatted

  Scenario: Browser print dialog is triggered
    When I open an email from the inbox
    And I click the "Print" button
    Then the browser print dialog should be triggered within 2 seconds

  Scenario: Print view shows email metadata
    When I open an email from the inbox
    And I click the "Print" button
    Then the print view should show the sender name
    And the print view should show the recipient
    And the print view should show the date
    And the print view should show the subject

  Scenario: Security — print endpoint requires authentication
    Given I am not logged in
    When I attempt to access the print view of an email
    Then I should be redirected to "/login"
    And I should not see any email content
