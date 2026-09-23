Feature: Frontend feature batch P1 (MW-2026-033)
  As a product owner
  I want all P1 frontend features implemented and tested
  So that the misfits.ai mail client has parity with modern email clients

  Background:
    Given the production site "https://mail.misfits.ai" is reachable

  Scenario: Bulk email selection is implemented
    Given the user is viewing the inbox
    When the user selects multiple emails
    Then a floating action bar appears with batch actions
    And the actions include archive, delete, mark read, move, label, and snooze

  Scenario: Email forward is implemented
    Given the user is viewing an email
    When the user clicks Forward and selects a recipient
    Then the composer pre-fills with subject and body
    And the email is sent successfully

  Scenario: Email export PDF + print is implemented
    Given the user is viewing an email
    When the user clicks Export PDF
    Then a PDF is generated with content, metadata, and clickable links
    And the print view is optimized for paper output

  Scenario: Email attachment preview is implemented
    Given an email with attachments
    When the user clicks on an attachment
    Then an inline preview is shown for images and PDFs
    And download and share buttons are available
    And unknown file types show a fallback download option

  Scenario: Reading mode is implemented
    Given the user is viewing an email
    When the user activates reading mode
    Then HTML content is sanitized and displayed distraction-free
    And a deactivation bar is visible for one-click exit

  Scenario: Keyboard shortcuts are implemented
    Given the user is in the inbox
    When the user presses "C"
    Then the composer opens
    And when the user presses "Ctrl+/"
    Then a keyboard shortcuts help panel is displayed

  Scenario: Swipe gestures are implemented
    Given the user is viewing the email list on a touch device
    When the user swipes left on an email
    Then the email is archived
    And when the user swipes right
    Then the email is marked as read
    And an undo option is available

  Scenario: AI summary is implemented
    Given the user is viewing an email
    When the user clicks AI Summary
    Then a summary is generated in under 5 seconds
    And displayed in the side panel

  Scenario: AI smart triage is implemented
    Given the user has 50 unread emails
    When the triage feature is activated
    Then emails are sorted by priority
    And action suggestions are provided (reply/archive/delete)

  Scenario: AI suggested replies are implemented
    Given the user is viewing an email
    When the user clicks Suggested Replies
    Then 3 contextual reply options are displayed
    And the user can insert one with a single click

  Scenario: Newsletter subscription is implemented
    Given the user receives a newsletter
    When the user subscribes from the email
    Then the newsletter is added to subscriptions
    And future emails are grouped in a dedicated folder

  Scenario: Interface language change is implemented
    Given the user is in settings
    When the user changes the interface language
    Then the interface translates in under 2 seconds
    And the preference is saved

  Scenario: On-device AI processing is implemented
    Given the user activates local AI mode
    Then AI processing happens on the device
    And no data is sent to the server for AI operations
