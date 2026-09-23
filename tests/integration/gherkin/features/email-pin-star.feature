Feature: Email pin/star for quick access (MW-2026-084 / UX-789)
  As a user with important emails
  I want to pin or star emails for quick access
  So that I can keep important messages visible and organized

  Background:
    Given the user is authenticated
    And the user is on the inbox view
    And there is at least one email in the inbox

  Scenario: Pin an email to the top of inbox
    When I click the "Pin" icon on an email row
    Then the email moves to a "Pinned" section at the top of the inbox
    And the pin icon appears filled/active on the email row

  Scenario: Unpin an email
    Given an email is pinned
    When I click the "Pin" icon on the pinned email
    Then the email returns to its normal position in the inbox
    And the pin icon appears outlined/inactive

  Scenario: Star an email
    When I click the "Star" icon on an email row
    Then the star icon appears filled/active
    And the email is marked as starred

  Scenario: Unstar an email
    Given an email is starred
    When I click the "Star" icon on the email row
    Then the star icon appears outlined/inactive
    And the email is no longer starred

  Scenario: Filter by starred emails
    Given at least one email is starred
    When I click the "Starred" smart folder in the navigation
    Then only starred emails are displayed in the list

  Scenario: Pinned emails persist across sessions
    Given an email is pinned
    When I refresh the page
    Then the email is still in the "Pinned" section at the top of the inbox

  Scenario: Starred emails persist across sessions
    Given an email is starred
    When I refresh the page
    Then the star icon is still filled/active on the email row

  Scenario: Pin and star state are independent
    Given an email is pinned
    When I click the "Star" icon on the pinned email
    Then the email is both pinned and starred
    And both icons appear filled/active
