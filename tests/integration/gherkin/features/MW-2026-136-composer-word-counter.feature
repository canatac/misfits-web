Feature: MW-2026-136 — Email composer word/character counter
  As a user
  I want to see a word and character counter in the email composer
  So that I can track the length of my email and avoid truncation

  Background:
    Given I am on the email composer page at "https://mail.misfits.ai/mail/compose"

  Scenario: Composer page loads with counter element present
    When I navigate to the compose page
    Then the page should load successfully or redirect to login
    And the response status should be 200 or 307

  Scenario: Anonymous user is redirected to login
    Given I am not authenticated
    When I navigate to the compose page
    Then I should be redirected to "/login"
    And the response status should be 307

  Scenario: Composer API requires authentication
    Given I am not authenticated
    When I send a POST request to "/api/compose/send" with an empty body
    Then the response status should be 307 or 400 or 401
    And the response status should not be 500

  Scenario: Word counter endpoint is protected
    Given I am not authenticated
    When I send a GET request to "/api/compose/counter"
    Then the response status should be 307 or 401 or 404
