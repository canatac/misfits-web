# language: en
# Scenarios of the QA for misfits-web#1091
# Landing page: 'Open dashboard' link leads anonymous visitors to a dead end

Feature: Landing page 'Open dashboard' link for a signed-out visitor
  The landing page shows an 'Open dashboard' link next to 'Sign in'.
  A visitor who is not authenticated clicks it and lands on /dashboard,
  which has no documented signed-out state: no redirect notice, no sign-in
  prompt, nothing that explains what happened.

  @AC1
  Scenario: A signed-out visitor clicking 'Open dashboard' is redirected to /login with a message explaining that sign-in is required
    Given a visitor who is not authenticated
    And the landing page is shown
    When the visitor clicks the 'Open dashboard' link
    Then the visitor is redirected to /login
    And a message explains that sign-in is required

  @AC2
  Scenario: The landing page documents its signed-out, signed-in and loading states
    Given the landing page
    Then its signed-out state is documented
    And its signed-in state is documented
    And its loading state is documented

  @AC3
  Scenario: The behaviour has a test
    Given the implementation of the signed-out redirect
    Then a test asserts that a signed-out visitor clicking 'Open dashboard' is redirected to /login with a message explaining that sign-in is required
