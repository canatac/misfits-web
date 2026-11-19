Feature: External accounts OAuth2 provider picker and consent journey
  The user connects an external account (Gmail, Outlook, Yahoo or Other) from the client:
  they pick a provider, are sent to the provider consent screen, and come back with
  the account listed and its folders synced into the unified inbox.

  @AC1
  Scenario: A "Connect an external account" action opens a picker listing Gmail, Outlook, Yahoo and Other
    Given the client has hooks use-oauth2-providers and use-oauth2-start and an API client
    And the provider catalogue GET /api/external-accounts/oauth2/providers returns Gmail, Outlook, Yahoo and Other
    When the user activates the "Connect an external account" action
    Then a picker opens listing Gmail, Outlook, Yahoo and Other
    And the picker is fed by GET /api/external-accounts/oauth2/providers

  @AC2
  Scenario: Choosing a provider starts the flow and navigates to the returned authorizationUrl
    Given the picker lists Gmail, Outlook, Yahoo and Other
    When the user chooses a provider
    Then the client starts the flow via GET /api/external-accounts/oauth2/start?provider=...
    And the client navigates to the returned authorizationUrl

  @AC3
  Scenario: After the callback the account is listed in the account switcher and its folders sync into the unified inbox
    Given the user has completed the provider consent screen and returned through the callback
    When the callback is handled
    Then the account is listed in the account switcher
    And its folders sync into the unified inbox

  @AC4
  Scenario: The picker and the flow are reachable by keyboard and expose their state to assistive technology
    Given the picker is open
    When the user reaches and activates a provider using the keyboard alone
    Then every provider shows a visible focus indicator
    And the chosen provider and the connection state are exposed to assistive technology
