Feature: MW-2026-134 — Email composer spell check
  As a user composing emails
  I want inline spell checking with suggestions
  So that I can send error-free emails

  Background:
    Given I am logged in as admin on "https://mail.misfits.ai"
    And I open the email composer

  Scenario: Misspelled word is highlighted inline
    When I type "Ths is a testt" in the composer body
    Then "Ths" should be underlined as misspelled
    And "testt" should be underlined as misspelled

  Scenario: Right-click shows suggestions
    When I right-click on a misspelled word
    Then a context menu with spelling suggestions should appear
    And the correct spelling should be among the suggestions

  Scenario: Selecting a suggestion replaces the word
    When I right-click on "testt"
    And I select "test" from the suggestions
    Then the text should now read correctly
    And the misspelling underline should disappear

  Scenario: Language selector is available
    When the composer is open
    Then a spell check language selector should be visible

  Scenario: Security — spell check does not leak content externally
    When I type text in the composer
    Then no external API calls should be made for spell checking
