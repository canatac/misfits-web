Feature: Connect an external account: OAuth2 provider picker and consent journey
  The user connects an external account (Gmail, Outlook, Yahoo or Other) from the client:
  they pick a provider, are sent to the provider consent screen, and come back with
  a clear success or error message, the account listed and its folders synced into
  the unified inbox.

  @AC1
  Scenario: A "Connect an external account" button opens a picker listing Gmail, Outlook, Yahoo and Other
    Given the client has the hooks use-oauth2-providers and use-oauth2-start
    And the provider catalogue GET /api/external-accounts/oauth2/providers returns Gmail, Outlook, Yahoo and Other
    When the user activates the "Connect an external account" button
    Then a picker opens listing Gmail, Outlook, Yahoo and Other
    And the picker is fed by GET /api/external-accounts/oauth2/providers

  @AC2
  Scenario: Choosing a provider redirects to the provider consent screen
    Given the picker lists Gmail, Outlook, Yahoo and Other
    When the user chooses the provider "Gmail"
    Then the client starts the flow via GET /api/external-accounts/oauth2/start?provider=gmail
    And the client redirects to the returned authorizationUrl

  @AC2
  Scenario: Returning from the consent screen shows a clear success message
    Given the user has completed the provider consent screen and returned to the app
    When the callback is handled
    Then the user sees a clear success message

  @AC2
  Scenario: A failure of the consent return shows a clear error message
    Given the provider consent screen returned an error
    When the callback is handled
    Then the user sees a clear error message naming the failure

  @AC3
  Scenario: During the redirect the user sees a loading state
    Given the user has chosen a provider
    When the authorization URL is being fetched
    Then the user sees a loading state

  @AC3
  Scenario: A revoked or expired token shows a readable error with a way to retry
    Given the user returns from the provider consent screen
    And the token of the account is revoked or expired
    When the callback is handled
    Then a readable error states that the token is revoked or expired
    And a way to retry is offered

  @AC4
  Scenario: The new account appears in the account list and in the unified inbox
    Given the user has completed the provider consent screen and returned to the app
    When the callback is handled
    Then the new account appears in the account list
    And the new account appears in the unified inbox
