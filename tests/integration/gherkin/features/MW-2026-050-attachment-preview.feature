Feature: MW-2026-050 — Attachment preview + quick actions
  As a user
  I want to preview attachments inline and perform quick actions
  So that I can view files without downloading and manage attachments efficiently

  Background:
    Given I am logged in as admin on "https://mail.misfits.ai"
    And I am on the inbox page "/mail"
    And at least one email with attachments is visible

  Scenario: Attachment preview is visible in email view
    When I open an email with an image attachment
    Then an inline preview thumbnail should be visible
    And the thumbnail should show the image content

  Scenario: PDF attachment shows preview
    When I open an email with a PDF attachment
    Then a PDF preview should be displayed inline
    Or a file icon with type badge should be shown

  Scenario: Quick actions are available on attachment
    When I hover over an attachment card
    Then quick action buttons should be visible
    And the actions should include: Download, Save to Files, Share link

  Scenario: Attachment shows file info badge
    When I view an attachment card
    Then a file type badge should be visible
    And the file size should be displayed
    And a security scan indicator should be shown

  Scenario: Clicking preview opens lightbox
    When I click on an image attachment preview
    Then a lightbox overlay should open
    And the full image should be displayed
    And navigation arrows should be visible if multiple images

  Scenario: Share link generates temporary URL
    When I click "Share" on an attachment
    Then a shareable link should be generated
    And the link should be copied to clipboard
