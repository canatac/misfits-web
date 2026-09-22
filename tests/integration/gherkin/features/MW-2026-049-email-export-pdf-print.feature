Feature: Email Export PDF + Print (MW-2026-049)
  As a user who needs to archive or share an email outside the app
  I want to export an email as PDF and print it
  So that I can keep a physical or portable record with proper formatting

  Background:
    Given the user is authenticated as admin@misfits.ai
    And the user has opened an email with subject "Quarterly Report" containing HTML body and metadata

  Scenario: Export email as PDF
    Given the user has opened an email
    When the user clicks the "Export PDF" action
    Then a PDF file is generated containing the email HTML content
    And the PDF includes email metadata (From, To, Date, Subject)
    And links in the PDF are clickable
    And the PDF is downloaded to the user's device

  Scenario: Print-optimized email view
    Given the user has opened an email
    When the user clicks the "Print" action
    Then a print-optimized view is displayed
    And the view uses print-friendly CSS (no navigation, clean layout)
    And the browser print dialog is triggered

  Scenario: Export email as EML
    Given the user has opened an email
    When the user clicks the "Export EML" action
    Then a .eml file is downloaded
    And the .eml contains the full RFC-822 message with headers and body

  Scenario: Export email as HTML
    Given the user has opened an email
    When the user clicks the "Export HTML" action
    Then a .html file is downloaded
    And the .html contains the sanitized email body with inline styles

  Scenario: PDF export preserves formatting
    Given the user has opened an email with complex HTML formatting (tables, bold, links)
    When the user exports as PDF
    Then the PDF preserves text formatting (bold, italic, lists)
    And the PDF preserves table layout
    And the PDF includes clickable hyperlinks
