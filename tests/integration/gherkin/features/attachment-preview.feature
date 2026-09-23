Feature: Email attachment preview with quick actions (MW-2026-050)
  As a user reading an email
  I want to preview attachments inline with quick actions
  So that I can quickly view, download, or share files without leaving the email

  Background:
    Given the user is authenticated
    And the user opens an email with attachments

  Scenario: Preview image attachment inline
    When I click on an image attachment "photo.png"
    Then the image is displayed inline in a preview panel
    And the attachment name "photo.png" is shown
    And the file size and MIME type are displayed

  Scenario: Preview PDF attachment inline
    When I click on a PDF attachment "document.pdf"
    Then the PDF is rendered in an inline viewer
    And the attachment name "document.pdf" is shown
    And the file size and MIME type are displayed

  Scenario: Download attachment
    When I click "Download" on an attachment
    Then the file is downloaded to my device
    And the download uses the original filename

  Scenario: Share attachment
    When I click "Share" on an attachment
    Then a share dialog is opened
    And I can copy a share link or send via email

  Scenario: Open attachment in new tab
    When I click "Open" on an attachment
    Then the file opens in a new browser tab
    And the Content-Type matches the attachment MIME type

  Scenario: Security — attachment endpoint requires authentication
    Given I am not authenticated
    When I send GET /api/emails/123/attachments/456
    Then the response status is 307 or 401
    And no binary content is returned

  Scenario: Security — cannot access other users' attachments
    Given I am authenticated as user A
    When I send GET to an attachment belonging to user B
    Then the response status is 403 or 404
    And no binary content is leaked
