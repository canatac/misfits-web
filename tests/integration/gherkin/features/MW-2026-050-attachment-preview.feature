Feature: MW-2026-050 — Email attachment preview with quick actions
  As a user
  I want to preview attachments inline and perform quick actions
  So that I can view files without downloading them and act efficiently

  Background:
    Given I am logged in as admin on "https://mail.misfits.ai"
    And I open an email containing an attachment

  Scenario: Attachment metadata is displayed
    When I view the email attachments section
    Then each attachment shows the file name
    And each attachment shows the file size
    And each attachment shows the MIME type icon

  Scenario: Image attachment inline preview
    When I click on an image attachment (jpg, png, gif, webp)
    Then an inline preview is displayed
    And the image is rendered within the email view

  Scenario: PDF attachment inline preview
    When I click on a PDF attachment
    Then an embedded PDF reader is displayed
    And I can navigate pages within the preview

  Scenario: Quick actions available on preview
    When I open an attachment preview
    Then a "Download" button is visible
    And a "Share" button is visible
    And an "Open in new tab" button is visible

  Scenario: Unsupported format fallback
    When I click on an unsupported file type
    Then a download link is shown
    And a message indicates preview is not available for this format

  Scenario: Attachment preview API endpoint exists
    When I request "/api/mail/attachment-preview" with a valid attachment ID
    Then the response status should be 200 or 401
    And the response should not be 404
