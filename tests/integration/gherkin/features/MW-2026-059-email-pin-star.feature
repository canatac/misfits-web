Feature: MW-2026-059 Email pin/star
  As a user
  I want to pin/star emails so they appear at the top of my list and I can filter them
  So that I can quickly find important emails

  Background:
    Given the user is authenticated on https://mail.misfits.ai
    And the inbox contains at least one email

  Scenario: Star an email from the inbox list
    Given the user is viewing the inbox
    When the user clicks the star icon on an email
    Then the email is marked as starred
    And the star icon appears filled/active

  Scenario: Unstar a previously starred email
    Given the user has starred an email
    When the user clicks the star icon on the starred email
    Then the email is no longer starred
    And the star icon appears empty/inactive

  Scenario: Filter inbox to show only starred emails
    Given the inbox contains starred and unstarred emails
    When the user clicks the "Starred" filter
    Then only starred emails are displayed in the list

  Scenario: Starred emails appear with visual indicator
    Given the user has starred an email
    When the user views the inbox list
    Then the starred email displays a filled star icon

  Scenario: POST /api/emails/{id}/action star requires authentication
    Given no session token is provided
    When POST /api/emails/{id}/action with body {"action":"star"} is sent
    Then the response status is 401
    And the response body contains an authentication error
    And no email data is leaked
