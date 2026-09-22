Feature: MW-2026-051 — Email export PDF + print + .eml for data portability
  As a power user
  I want to export emails as PDF, print them, or download as .eml
  So that I can archive, share, or keep legal records of my emails.

  Background:
    Given I am logged in to "https://mail.misfits.ai" as admin
    And I have at least one email in my inbox

  Scenario: Export button is visible in email toolbar
    When I open an email from the inbox
    Then I should see an "Export" button in the email toolbar
    And the button should have aria-label "Exporter l'email"

  Scenario: Export dropdown shows PDF, Print, EML options
    Given I am viewing an email
    When I click the "Export" button
    Then a dropdown menu should appear with options:
      | option   |
      | PDF      |
      | Imprimer |
      | .eml     |
      | .html    |

  Scenario: Export as PDF generates a downloadable file
    Given I am viewing an email
    When I click the "Export" button
    And I select "PDF" from the dropdown
    Then a PDF file should be generated
    And the file should contain the email subject and body text

  Scenario: Print button opens browser print dialog
    Given I am viewing an email
    When I click the "Export" button
    And I select "Imprimer" from the dropdown
    Then the browser print dialog should be triggered
    And the print stylesheet should format the email for paper

  Scenario: Export as .eml downloads raw email file
    Given I am viewing an email
    When I click the "Export" button
    And I select ".eml" from the dropdown
    Then a .eml file should be downloaded
    And the file should contain the full email headers and body

  Scenario: Export as .html downloads standalone HTML
    Given I am viewing an email
    When I click the "Export" button
    And I select ".html" from the dropdown
    Then a .html file should be downloaded
    And the file should contain the email content with inline styles
