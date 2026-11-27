Feature: Post-deploy check mail
  As a deployment pipeline
  I want the post-deploy check "mail" to pass on production
  So that the mail route is verified as operational after deployment

  @AC1
  Scenario: Post-deploy check "mail" passes on production after the next deploy
    Given the application is deployed to production
    When the post-deploy check "mail" runs on the /mail route
    Then the check completes without errors
    And the /mail route renders without hydration mismatches
    And all API calls from /mail return successful responses
