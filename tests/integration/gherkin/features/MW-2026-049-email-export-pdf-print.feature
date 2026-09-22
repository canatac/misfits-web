Feature: MW-2026-049 — Email export PDF + print
  As a user
  I want to export an email as PDF and print it
  So that I can keep a physical or digital copy with proper formatting

  Background:
    Given I am logged in as admin on "https://mail.misfits.ai"
    And I am on the inbox page "/mail"
    And at least one email is visible in the inbox

  Scenario: Export PDF button is available on email view
    When I open an email
    Then an "Export PDF" action should be visible in the email toolbar or menu

  Scenario: Export PDF generates a PDF file
    When I open an email
    And I click "Export PDF"
    Then a PDF file should be generated
    And the PDF should contain the email HTML content
    And the PDF should include email metadata (sender, subject, date)

  Scenario: PDF contains clickable links
    When I export an email containing links as PDF
    Then the links in the PDF should be clickable
    And the link URLs should be preserved

  Scenario: Print-optimized layout
    When I open an email
    And I trigger the print action
    Then the print view should use a print-optimized stylesheet
    And unnecessary UI elements (header, sidebar) should be hidden
    And the email content should be formatted for paper output

  Scenario: Export as EML is available
    When I open an email
    Then an "Export EML" or "Download .eml" option should be available

  Scenario: Export as HTML is available
    When I open an email
    Then an "Export HTML" or "Download .html" option should be available

  Scenario: PDF includes attachments indicator
    When I export an email with attachments as PDF
    Then the PDF should indicate that attachments exist
    And attachment filenames should be listed

  Scenario: Export works on long emails
    When I open an email with content longer than one page
    And I export it as PDF
    Then the PDF should properly paginate the content
    And no content should be cut off
