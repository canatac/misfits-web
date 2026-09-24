Feature: MW-2026-110 — Email list density toggle
  As a user browsing my inbox
    I want to adjust the density of the email list
  So that I can see more emails per screen or have more breathing room

  Background:
    Given I am logged in as admin on "https://mail.misfits.ai"
    And I am on the inbox page "/mail"

  Scenario: Density toggle is visible in settings or toolbar
    When the inbox loads
    Then a density toggle or list view settings control should be visible

  Scenario: Compact density shows more emails per screen
    When I set the density to "Compact"
    Then email rows should have reduced padding
    And more emails should be visible per screen compared to comfortable mode

  Scenario: Comfortable density has more spacing
    When I set the density to "Comfortable"
    Then email rows should have increased padding
    And fewer emails should be visible per screen compared to compact mode

  Scenario: Density preference persists across sessions
    When I set the density to "Compact"
    And I reload the page
    Then the density should still be set to "Compact"
    And email rows should have reduced padding

  Scenario: Switching between density modes updates the list
    When I set the density to "Compact"
    And I switch to "Comfortable"
    Then the email list should immediately update with increased spacing
