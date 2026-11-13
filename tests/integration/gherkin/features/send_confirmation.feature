Feature: Send confirmation for large recipient lists (issue #1059)
  As a user sending to many recipients,
  I want a confirmation before the message is sent,
  so that I do not email a large list by mistake.

  Background:
    Given the source file "src/components/mail/composer/send-confirm-modal.tsx" is loaded
    And the source file "src/components/mail/composer-panel.tsx" is loaded
    And the source file "src/components/mail/composer/send-confirm-settings.tsx" is loaded

  Scenario: The confirmation modal appears when the recipient count exceeds the threshold
    Given the source file "src/components/mail/composer-panel.tsx" is loaded
    Then the composer asks for confirmation when the recipient count exceeds the threshold

  Scenario: The modal lists the recipients by group
    Given the source file "src/components/mail/composer/send-confirm-modal.tsx" is loaded
    Then the modal shows the To, Cc and Bcc recipients with the total count

  Scenario: The skip preference is persisted in localStorage
    Given the source file "src/components/mail/composer/send-confirm-modal.tsx" is loaded
    Then the "Don't ask again" preference is persisted in localStorage

  Scenario: The recipient count is shown in the composer footer
    Given the source file "src/components/mail/composer/composer-footer.tsx" is loaded
    Then the footer shows the recipient count

  Scenario: The threshold is configurable in Settings
    Given the source file "src/components/mail/composer/send-confirm-settings.tsx" is loaded
    Then the Settings panel reads and writes the recipient threshold
