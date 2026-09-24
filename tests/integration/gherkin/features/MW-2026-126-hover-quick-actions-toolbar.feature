Feature: Email hover quick-actions toolbar
  As a power user processing 100+ emails/day
  I want a quick-actions toolbar on hover so I can act without opening the email

  Background:
    Given the user is logged in to mail.misfits.ai
    And the inbox contains at least one email

  Scenario: Hover toolbar appears with action buttons
    When the user hovers over an email in the inbox list
    Then a quick-actions toolbar is visible
    And the toolbar contains an Archive button
    And the toolbar contains a Delete button
    And the toolbar contains a Mark read button
    And the toolbar contains a Snooze button
    And the toolbar contains a Forward button

  Scenario: Archive action from hover toolbar
    When the user hovers over an email in the inbox list
    And the user clicks the Archive button on the hover toolbar
    Then the email is archived
    And the email is removed from the inbox list
    And the toolbar closes after the action

  Scenario: Delete action from hover toolbar
    When the user hovers over an email in the inbox list
    And the user clicks the Delete button on the hover toolbar
    Then the email is moved to trash
    And the email is removed from the inbox list

  Scenario: Mark as read from hover toolbar
    When the user hovers over an unread email in the inbox list
    And the user clicks the Mark read button on the hover toolbar
    Then the email is marked as read
    And the unread badge disappears from the email row

  Scenario: Toolbar hides when mouse leaves
    When the user hovers over an email in the inbox list
    And the hover toolbar is visible
    And the user moves the mouse away from the email row
    Then the toolbar is hidden with a smooth transition

  Scenario: Toolbar actions do not open the email
    When the user hovers over an email in the inbox list
    And the user clicks the Archive button on the hover toolbar
    Then the email detail view is not opened
    And the user remains on the inbox page
