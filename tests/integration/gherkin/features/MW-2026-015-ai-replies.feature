Feature: MW-2026-015 — AI suggested replies
  As a user
  I want AI to suggest contextual replies to emails
  So that I can respond quickly without typing from scratch

  Background:
    Given I am logged in as "qa.admin@misfits.fr"
    And I have an email that asks a question

  Scenario: AI suggests replies when opening an email
    When I open an email
    Then I should see a "Suggested replies" or "Réponses suggérées" button
    When I click it
    Then 3 contextual reply options should be displayed

  Scenario: Suggestions are contextually relevant
    Given an email asks "Are you available tomorrow at 2pm?"
    When I request suggested replies
    Then one suggestion should be "Yes, I'm available"
    And one should be "No, I'm not available"
    And one should be "I'll check and get back to you"

  Scenario: Insert suggestion with one click
    Given I see 3 suggested replies
    When I click on the first suggestion
    Then it should be inserted into the reply composer
    And I can edit it before sending

  Scenario: Generate new suggestions
    Given I see the suggested replies
    When I click "Generate more"
    Then 3 new suggestions should appear
    And they should be different from the previous ones

  Scenario: AI unavailable fallback
    Given the AI service is unavailable
    When I click "Suggested replies"
    Then I should see an error message
    And the reply composer should still be usable
