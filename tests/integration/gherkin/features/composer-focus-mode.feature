Feature: Composer focus mode (MW-2026-044)
  As a user composing an email
  I want a distraction-free focus mode
  So that I can concentrate on writing

  Background:
    Given the user is authenticated
    And the email composer is open

  Scenario: Activate focus mode
    When I click "Focus mode" in the composer
    Then the sidebar is hidden
    And the background is darkened
    And the compose area is centered with max-width 700px

  Scenario: Exit focus mode via Escape key
    Given focus mode is active
    When I press the "Escape" key
    Then focus mode is deactivated
    And the sidebar is visible again
    And the background returns to normal

  Scenario: Exit focus mode via close button
    Given focus mode is active
    When I click the close/exit button
    Then focus mode is deactivated
    And the composer returns to normal view

  Scenario: Content preserved after exiting focus mode
    Given focus mode is active
    And I have typed "Important message body" in the composer
    When I press "Escape" to exit focus mode
    Then the text "Important message body" is still in the composer
    And the recipient and subject fields are unchanged
