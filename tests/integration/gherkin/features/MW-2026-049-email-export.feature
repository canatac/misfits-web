Feature: MW-2026-049 — Email export PDF + print + .eml for data portability
  As a user
  I want to export my emails as PDF, print them, or download as .eml/.html
  So that I can keep offline copies and maintain data portability

  Background:
    Given I am logged in as admin on "https://mail.misfits.ai"
    And I am on the inbox page "/mail"
    And at least one email is visible in the inbox

  Scenario: Export button is visible on email view
    When I open an email from the inbox
    Then an "Export" action should be visible in the email toolbar or menu

  Scenario: Export email as PDF
    Given I have opened an email
    When I click "Export" and select "PDF"
    Then a PDF file should be generated
    And the PDF should contain the email subject, from, date, and body

  Scenario: Export email as EML
    Given I have opened an email
    When I click "Export" and select "EML"
    Then a .eml file should be downloaded
    And the file should contain RFC-822 compliant email data

  Scenario: Export email as HTML
    Given I have opened an email
    When I click "Export" and select "HTML"
    Then a .html file should be downloaded
    And the file should contain the formatted email content

  Scenario: Print email with optimized layout
    Given I have opened an email
    When I click "Print"
    Then the browser print dialog should open
    And the print layout should exclude UI elements (nav, sidebar, toolbar)

  Scenario: PDF includes attachments list
    Given I have opened an email with attachments
    When I export as PDF with attachments enabled
    Then the PDF should list attachment names and sizes
