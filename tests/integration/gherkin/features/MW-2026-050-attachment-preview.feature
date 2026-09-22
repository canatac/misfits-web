Feature: MW-2026-050 — Email attachment preview with quick actions
  As a user
  I want to preview email attachments directly in the email view
  So that I can view images, PDFs, and other files without downloading them first

  Background:
    Given I am logged in as admin on "https://mail.misfits.ai"
    And I am on the inbox page "/mail"
    And at least one email with an attachment is visible in the inbox

  Scenario: Attachment indicator is visible on emails with attachments
    When I look at the inbox email list
    Then emails with attachments should display a paperclip or attachment indicator

  Scenario: Attachment section is visible when opening an email
    When I open an email that contains an attachment
    Then the attachment section should be visible below the email body
    And each attachment should display its filename and size

  Scenario: Image attachment shows inline preview
    When I open an email with an image attachment (jpg, png, gif)
    Then a thumbnail or inline preview of the image should be visible
    And clicking the preview should open a full-size lightbox view

  Scenario: PDF attachment shows preview
    When I open an email with a PDF attachment
    Then a PDF preview or icon should be displayed
    And the filename and file size should be visible

  Scenario: Download button is available for each attachment
    When I open an email with an attachment
    Then each attachment row should have a "Download" button
    And clicking "Download" should trigger a file download

  Scenario: Share action is available for attachments
    When I open an email with an attachment
    Then each attachment row should have a "Share" or action menu
    And clicking it should open sharing options

  Scenario: Unknown file type shows fallback
    When I open an email with an unknown file type attachment
    Then a generic file icon should be displayed
    And the filename and size should still be visible
    And a download button should still be available

  Scenario: Multiple attachments are all displayed
    When I open an email with 3 attachments
    Then all 3 attachments should be listed
    And each should have independent preview and download controls
