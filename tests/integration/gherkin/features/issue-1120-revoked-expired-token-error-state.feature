Feature: External accounts revoked and expired token error state
  As a user of misfits.ai Mail
  I want to know when the OAuth2 refresh token of an external account is revoked or expired
  So that I can reconnect the account instead of seeing a silent failure

  Background:
    Given the client has an external account connected with OAuth2
    And the API answers HTTP 401 with code OAUTH2_TOKEN_REVOKED

  @AC1
  Scenario: A revoked or expired token shows a message stating the account must be reconnected
    When the sync of the external account fails with the revoked or expired token
    Then a message states that the account must be reconnected
    And a "Reconnect" action is offered

  @AC1
  Scenario: The Reconnect action restarts the OAuth2 flow
    Given the message stating that the account must be reconnected is shown
    When I activate the "Reconnect" action
    Then the OAuth2 flow restarts via GET /api/external-accounts/oauth2/start?provider=...

  @AC2
  Scenario: The error message is announced to assistive technology
    When the message stating that the account must be reconnected is shown
    Then the message is announced through an aria-live region

  @AC3
  Scenario: The account is marked as needing attention in the account switcher
    When the sync of the external account fails with the revoked or expired token
    Then the account is marked as needing attention in the account switcher
