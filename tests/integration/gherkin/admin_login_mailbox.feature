Feature: Admin login and mailbox stability on deployed mail.misfits.ai
  As QA automation
  I need to validate admin access and mailbox opening on production URL
  So regressions are detected with runnable proof

  Scenario: Admin reaches mailbox without runtime crash
    Given the deployed URL "https://mail.misfits.ai/mail" is opened
    When I complete admin login if credentials are available
    Then the final page should not be login
    And mailbox page should not display "Internal Server Error"
    And mailbox evidence artifacts should be written
