Feature: MW-2026-1011 Email composer attachment size warning — progress bar + send block
  As a user
  I want to see a visual warning when my attachments exceed size limits
  So that I know when my email cannot be sent due to attachment size

  Background:
    Given the user is logged in
    And the user is on the compose page

  Scenario: Warning displayed when total attachment size exceeds 10MB
    When the user adds attachments totaling more than 10MB
    Then a size warning is visible in the composer footer
    And the total attachment size is displayed

  Scenario: Progress bar shows attachment size relative to limit
    When the user adds attachments to the email
    Then a progress bar is visible in the composer footer
    And the progress bar reflects the total size relative to the 25MB limit

  Scenario: Send is blocked when total attachment size exceeds 25MB
    When the user adds attachments totaling more than 25MB
    Then the Send button is disabled
    And a warning message indicates the size limit is exceeded

  Scenario: Send is allowed when total attachment size is under 25MB
    When the user adds attachments totaling less than 25MB
    Then the Send button is enabled
    And no blocking warning is displayed

  Scenario: Progress bar color changes with size
    When the user adds attachments totaling less than 10MB
    Then the progress bar shows green
    When the user adds more attachments totaling between 10MB and 25MB
    Then the progress bar shows yellow
    When the user adds more attachments totaling more than 25MB
    Then the progress bar shows red
