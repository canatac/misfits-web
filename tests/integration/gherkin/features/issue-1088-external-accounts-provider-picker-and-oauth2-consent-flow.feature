Feature: External accounts: provider picker and OAuth2 consent flow
  The user connects an external account (Gmail, Outlook, Yahoo or Other) from the client:
  they open the picker, choose a provider, are sent to the provider consent screen,
  come back with a clear success or error message, and the account appears in the
  account list with its sync state.

  @AC1
  Scenario: A "Connect an external account" button opens a picker listing Gmail, Outlook, Yahoo and Other
    Given the provider catalogue GET /api/external-accounts/oauth2/providers returns Gmail, Outlook, Yahoo and Other
    When the user activates the "Connect an external account" button
    Then a provider picker opens listing Gmail, Outlook, Yahoo and Other
    And the picker is fed by GET /api/external-accounts/oauth2/providers

  @AC2
  Scenario: Choosing a provider redirects the user to the provider consent screen and returns to the app
    Given the picker lists Gmail, Outlook, Yahoo and Other
    When the user chooses the provider "Gmail"
    Then the client starts the flow via GET /api/external-accounts/oauth2/start?provider=gmail
    And the client redirects to the returned authorizationUrl
    And after authorization the user returns to the app

  @AC3
  Scenario: The picker is reachable by keyboard and exposes its state to assistive technology
    Given the picker is open
    When the user moves through the providers with the keyboard alone
    Then every provider is reachable and shows a visible focus indicator
    And the chosen provider is announced to assistive technology

  @AC3
  Scenario: The consent step exposes its state to assistive technology
    Given the user has chosen a provider
    When the consent step is shown
    Then its state is exposed to assistive technology

  @AC4
  Scenario: A failed or revoked authorization shows a clear, non-technical error with a way to retry
    Given the provider authorization failed or was revoked
    When the user returns to the app
    Then a clear, non-technical error is shown
    And a way to retry is offered

  @AC5
  Scenario: The account appears in the account list with its sync state once connected
    Given the user has completed the provider consent screen and returned to the app
    When the callback is handled
    Then the account appears in the account list
    And its sync state is shown
