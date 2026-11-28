Feature: Post-deploy check compose
  As a deployment pipeline
  I want the compose post-deploy check to pass on production
  So that the email composition functionality is verified after deployment

  @AC1
  Scenario: Post-deploy check "compose" passes on production
    Given the application is deployed to production
    When the post-deploy check "compose" runs
    Then the check passes with no visibility errors
