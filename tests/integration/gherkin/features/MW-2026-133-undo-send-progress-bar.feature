Feature: MW-2026-133 Undo send with progress bar — visual countdown + cancel
  As a user
  I want to see a progress bar during the undo-send window
  So that I know how much time remains to cancel the send

  Background:
    Given the user is logged in
    And the user is on the compose page

  Scenario: Progress bar visible after sending with undo option
    When the user composes and sends an email
    Then an undo toast with a progress bar is displayed
    And the progress bar starts at 5 seconds

  Scenario: Progress bar counts down from 5s to 0s
    Given the undo send toast is visible
    Then the progress bar shrinks over 5 seconds
    And the remaining time is displayed

  Scenario: Clicking the progress bar cancels the send
    Given the undo send toast is visible with a progress bar
    When the user clicks the progress bar
    Then the email send is cancelled
    And the email is moved to drafts
    And the undo toast is dismissed

  Scenario: Escape key triggers undo
    Given the undo send toast is visible with a progress bar
    When the user presses the "Escape" key
    Then the email send is cancelled
    And the email is moved to drafts

  Scenario: Progress bar has accessible aria-label with countdown
    Given the undo send toast is visible
    Then the progress bar has an aria-label attribute
    And the aria-label contains the remaining seconds

  Scenario: Progress bar color transitions green to yellow to red
    Given the undo send toast is visible
    Then the progress bar starts green
    When 2 seconds have elapsed
    Then the progress bar shows yellow
    When 4 seconds have elapsed
    Then the progress bar shows red

  Scenario: Send completes after 5 seconds if no action taken
    Given the undo send toast is visible
    When 5 seconds elapse without user interaction
    Then the progress bar reaches 0
    And the email is permanently sent
    And the undo toast is dismissed
