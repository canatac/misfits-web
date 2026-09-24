Feature: MW-2026-119 — Email list inline preview expansion
  As a user browsing my inbox
  I want to expand an email row to see a 3-line preview inline
  So that I can quickly scan email content without opening each one

  Background:
    Given I am logged in as admin on "https://mail.misfits.ai"
    And I am on the inbox page "/mail"

  Scenario: Email list shows collapsed rows by default
    When the inbox loads
    Then each email row should show subject, sender, and date
    And the full email body preview should not be visible

  Scenario: Clicking an email row expands inline preview
    When I click on an email row in the inbox
    Then the row should expand to show a 3-line preview of the email body
    And attachment icons should be visible if the email has attachments
    And the sender avatar should be visible

  Scenario: Clicking expanded row collapses it
    When I click on an email row to expand it
    And I click the same row again
    Then the row should collapse back to its original height
    And the 3-line preview should be hidden

  Scenario: Keyboard shortcut E toggles preview expansion
    When I focus an email row
    And I press the "E" key
    Then the row should expand to show the inline preview
    And when I press "E" again
    Then the row should collapse

  Scenario: Expanded state persists in localStorage
    When I expand an email row
    And I refresh the page
    Then the previously expanded row should remain expanded
    Or the global preview toggle state should be preserved in localStorage under "email_preview_expanded"

  Scenario: Only one email expanded at a time (accordion mode)
    When I expand the first email row
    And I expand the second email row
    Then the first email row should collapse
    And only the second email row should be expanded

  Scenario: Preview shows attachment icons
    When an email has attachments
    And I expand the email row
    Then attachment type icons should be visible in the preview area

  Scenario: Inline preview requires authentication
    Given I am not logged in
    When I attempt to expand an email row
    Then I should be redirected to "/login"
    And no email content should be visible
