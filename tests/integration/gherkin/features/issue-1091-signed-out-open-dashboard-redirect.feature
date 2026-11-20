Feature: Signed-out 'Open dashboard' redirect and landing states
  As a visitor who is not signed in
  I want the landing page to tell me what happens when I open the dashboard
  So that I am not left on a blank or broken screen

  @AC1
  Scenario: A signed-out user activating 'Open dashboard' is redirected to the sign-in screen
    Given I am not signed in
    And I am on the landing page
    When I activate "Open dashboard"
    Then I am redirected to the sign-in screen

  @AC2
  Scenario: The landing page states that the dashboard requires a sign-in
    Given I am not signed in
    And I am on the landing page
    When I read the landing page
    Then the landing page states that the dashboard requires a sign-in
