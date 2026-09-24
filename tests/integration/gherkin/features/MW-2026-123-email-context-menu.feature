Feature: Email context menu (right-click) with quick actions
  As a power user
  I want a right-click context menu on emails in the list
  So that I can perform frequent actions in one step instead of two

  Background:
    Given the user is logged in to mail.misfits.ai
    And the inbox is loaded with at least one email

  Scenario: Right-click on email opens context menu
    When the user right-clicks on an email in the inbox list
    Then a context menu appears at the cursor position within 200ms
    And the menu contains the following actions:
      | action          |
      | Archiver        |
      | Marquer lu      |
      | Marquer non lu  |
      | Supprimer       |
      | Déplacer        |
      | Étiqueter       |
      | Répondre        |
      | Transférer      |
      | Marquer spam    |

  Scenario: Context menu actions are functional
    Given the context menu is open on an email
    When the user clicks "Archiver"
    Then the email is archived
    And the context menu closes

  Scenario: ESC key closes context menu
    Given the context menu is open on an email
    When the user presses the ESC key
    Then the context menu closes
    And no action is performed

  Scenario: Click elsewhere closes context menu
    Given the context menu is open on an email
    When the user clicks outside the menu
    Then the context menu closes
    And no action is performed

  Scenario: Long-press on mobile opens context menu
    Given the user is on a mobile device
    And the inbox is loaded with at least one email
    When the user long-presses on an email in the list
    Then the context menu appears with the same actions as desktop right-click

  Scenario: Keyboard accessible context menu
    Given the user is focused on an email in the inbox list
    When the user presses Shift+F10
    Then the context menu appears near the focused email
