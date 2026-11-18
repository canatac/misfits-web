# language: en
Feature: Landing page: Open dashboard without being signed in
  The landing page offers an "Open dashboard" link next to "Sign in".
  A visitor who is not signed in must not be sent to a dashboard they cannot use.

  @AC1
  Scenario: A visitor who is not signed in and opens the dashboard is redirected to the sign-in page
    Given a visitor who is not signed in
    When the visitor opens the dashboard
    Then the visitor is redirected to the sign-in page

  @AC2
  Scenario: After sign in, the visitor lands on the dashboard
    Given a visitor who is not signed in and was redirected to the sign-in page
    When the visitor signs in
    Then the visitor lands on the dashboard

  @AC3
  Scenario: The change has a test
    Given the change of issue #1103 is implemented
    When the test suite runs
    Then a test covers the redirect of a visitor who is not signed in
