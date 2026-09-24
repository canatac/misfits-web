Feature: MW-2026-1013 Pre-send attachment confirmation dialog — size + confirm/cancel
  As a user
  I want to see a confirmation dialog before sending large attachments
  So that I can review the size and confirm or cancel the send

  Background:
    Given the user is logged in
    And the user is on the compose page

  Scenario: Confirmation modal appears for large attachments (>10MB)
    When the user composes an email
    And the user attaches a file larger than 10MB
    And the user clicks the Send button
    Then a confirmation modal is displayed
    And the modal shows the total attachment size

  Scenario: Confirm sends the email
    Given the pre-send confirmation modal is displayed
    When the user clicks the "Confirmer" button
    Then the modal is closed
    And the email is sent
    And a success confirmation is displayed

  Scenario: Cancel blocks the send
    Given the pre-send confirmation modal is displayed
    When the user clicks the "Annuler" button
    Then the modal is closed
    And the email is NOT sent
    And the compose form is still visible with the draft

  Scenario: Send is blocked until user confirms
    When the user composes an email with attachments larger than 10MB
    And the user clicks the Send button
    Then the email is not sent until the user confirms
    And the composer remains in its current state

  Scenario: No confirmation for small attachments
    When the user composes an email
    And the user attaches a file smaller than 10MB
    And the user clicks the Send button
    Then no confirmation modal is displayed
    And the email is sent directly
