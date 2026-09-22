Feature: MW-2026-023 — Interface language change
  As a user
  I want to change the interface language
  So that I can use the app in my preferred language

  Background:
    Given I am logged in as "qa.admin@misfits.fr"
    And the default interface language is "French"

  Scenario: Language selector visible in settings
    When I navigate to Settings
    Then I should see a "Language" or "Langue" option

  Scenario: Change language to English
    Given I am in Settings > Language
    When I select "English"
    Then the interface should switch to English within 2 seconds
    And the preference should be saved

  Scenario: UI elements translated after language change
    Given I changed the language to English
    When I navigate to the inbox
    Then buttons should show English labels (Compose, Archive, Delete)
    And error messages should be in English

  Scenario: Language preference persists across sessions
    Given I set the language to English
    When I log out and log back in
    Then the interface should still be in English

  Scenario: Multiple languages available
    When I open the language selector
    Then I should see at least French, English, and Spanish options
