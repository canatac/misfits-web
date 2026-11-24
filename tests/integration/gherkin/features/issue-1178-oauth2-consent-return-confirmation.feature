Feature: OAuth2 consent return confirmation for the add-account modal
  As a user adding an external account
  I want a confirmation when I return from the provider consent screen
  So that I know whether the account is connected, still syncing, or failed

  @AC1
  Scenario: Successful consent return confirms the account and its state
    Given a user has returned from the provider consent screen
    When the consent return succeeds
    Then a confirmation naming the account (email or provider) and its state (connected, syncing) is shown to the user

  @AC2
  Scenario: The confirmation is announced to assistive technology
    Given a confirmation is shown after the consent return
    When the confirmation appears
    Then it is announced to assistive technology through a live region

  @AC3
  Scenario: A failure after the consent return names the cause
    Given a user has returned from the provider consent screen
    When the consent return fails because the token is revoked or expired
    Then a distinct error naming the cause (revoked or expired token) is shown
    And the modal does not close silently

  @AC4
  Scenario: Each state has a test
    Given the add-account consent return flow
    When each state occurs (connected, syncing, revoked or expired token)
    Then each state has a test
