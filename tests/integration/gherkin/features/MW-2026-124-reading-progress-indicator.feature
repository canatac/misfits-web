Feature: Email reading progress indicator
  As a user reading long emails
  I want a progress bar showing my reading position
  So that I know how much of the email I have read

  Background:
    Given the user is logged in to mail.misfits.ai
    And the user opens a long email in the reading pane

  Scenario: Progress bar visible on long email
    When the user opens an email longer than one viewport
    Then a thin progress bar (2px) is visible at the top of the reading pane
    And the progress bar shows 0% initially

  Scenario: Progress bar updates during scroll
    Given the user is reading a long email
    When the user scrolls down through the email
    Then the progress bar percentage increases in real-time
    And the progress bar reaches 100% when the bottom is reached

  Scenario: Progress bar disappears at 100%
    Given the user has scrolled to the bottom of an email
    When the progress bar reaches 100%
    Then the progress bar disappears within 1 second

  Scenario: Progress bar disappears when email collapsed
    Given the progress bar is visible on an email
    When the user collapses the email view
    Then the progress bar is hidden

  Scenario: Reading position persisted per email
    Given the user has scrolled to 50% of an email
    When the user closes and reopens the same email
    Then the progress bar shows approximately 50%
