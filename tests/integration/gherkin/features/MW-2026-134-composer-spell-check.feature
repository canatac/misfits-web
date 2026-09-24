Feature: MW-2026-134 — Email composer spell check
  As a user
  I want inline spell checking in the email composer
  So that I can catch typos before sending

  Background:
    Given I am logged in as "qa.admin@misfits.fr"
    And I am on the compose page

  Scenario: Misspelled words are highlighted inline
    When I type "Ths is a test email with a speling error" in the email body
    Then misspelled words should be underlined in red
    And correctly spelled words should not be underlined

  Scenario: Right-click on misspelled word shows suggestions
    Given I have typed a misspelled word in the email body
    When I right-click on the misspelled word
    Then a context menu with spelling suggestions should appear
    And the suggestions should include the correct spelling

  Scenario: Clicking a suggestion replaces the misspelled word
    Given the spelling suggestion menu is open
    When I click on the first suggestion
    Then the misspelled word should be replaced with the suggestion
    And the red underline should disappear

  Scenario: Language selector supports FR/EN/ES/DE
    When I open the spell check language selector
    Then I should see options for "Français", "English", "Español", "Deutsch"
    And I can select a different language
    And the spell check language preference should be saved

  Scenario: Spell check toggle in Settings
    When I navigate to Settings
    Then I should see a "Spell check" toggle
    And toggling it off should disable inline spell checking in the composer
    And toggling it on should enable inline spell checking in the composer

  Scenario: Spell check does not flag email addresses as errors
    When I type "Contact us at info@misfits.fr" in the email body
    Then "misfits.fr" should not be underlined as a misspelling

  Scenario: Spell check does not flag technical terms in context
    When I type "The DKIM signature passes DMARC validation" in the email body
    Then "DKIM" and "DMARC" should not be flagged as misspellings
