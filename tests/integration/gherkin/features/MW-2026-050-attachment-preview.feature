Feature: MW-2026-050 — Email attachment preview with quick actions
  As a user
  I want to preview attachments inline and perform quick actions (download/share)
  So that I can view files without leaving my inbox

  Background:
    Given I am logged in as admin on "https://mail.misfits.ai"
    And I am on the inbox page "/mail"
    And at least one email with attachments is visible in the inbox

  Scenario: Attachment indicator is visible on emails with attachments
    When I look at the inbox list
    Then emails with attachments should display a paperclip or attachment indicator

  Scenario: Clicking on an image attachment opens inline preview
    Given I have opened an email with an image attachment
    When I click on the image attachment thumbnail
    Then an inline preview overlay should appear
    And the full-resolution image should be displayed
    And a close button should be visible

  Scenario: Clicking on a PDF attachment opens inline preview
    Given I have opened an email with a PDF attachment
    When I click on the PDF attachment
    Then an inline PDF preview should open
    And the first page of the PDF should be visible
    And navigation controls (next/previous page) should be present

  Scenario: Download button is available in attachment preview
    Given I am viewing an inline attachment preview
    Then a "Download" button should be visible
    When I click the "Download" button
    Then the attachment file should be downloaded

  Scenario: Share button is available in attachment preview
    Given I am viewing an inline attachment preview
    Then a "Share" button should be visible

  Scenario: Unsupported attachment type shows fallback
    Given I have opened an email with an unsupported file attachment
    When I click on the attachment
    Then a fallback view should be displayed
    And the filename and file size should be shown
    And a "Download" button should be available

  Scenario: Preview overlay can be closed
    Given I am viewing an inline attachment preview
    When I click the close button or press Escape
    Then the preview overlay should close
    And I should return to the email view
