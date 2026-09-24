Feature: MW-2026-110 — Email list density toggle
  As a user with many emails
    I want to control the density of the email list
  So that I can see more emails at once or have a more comfortable reading experience

  Background:
    Given I am logged in as admin on "https://mail.misfits.ai"
    And I am on the inbox page "/mail"

  Scenario: Density toggle is visible in settings or toolbar
    When the inbox loads
    Then a density control option should be visible

  Scenario: Switching to compact density
    When I select "Compact" density
    Then the email list rows should become smaller
    And more emails should be visible on screen
    And the preference should be saved

  Scenario: Switching to comfortable density
    When I select "Comfortable" density
    Then the email list rows should have more spacing
    And fewer emails should be visible on screen
    And the preference should be saved

  Scenario: Density preference persists across sessions
    When I select "Compact" density
    And I refresh the page
    Then the density should still be "Compact"

  Scenario: Security — density preference requires authentication
    Given I am not logged in
    When I attempt to change density settings
    Then I should be redirected to "/login"
