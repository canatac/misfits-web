Feature: External accounts OAuth2 provider picker and consent journey
  As a user of misfits.ai Mail
  I want to connect an external account with a provider picker
  So that its folders sync into the unified inbox

  Background:
    Given the external account provider catalogue returns Gmail, Outlook, Yahoo and Other

  @AC1
  Scenario: The picker lists the providers of the catalogue
    When I activate the "Connect an external account" action
    Then a picker opens listing Gmail, Outlook, Yahoo and Other
    And the picker is fed by GET /api/external-accounts/oauth2/providers

  @AC2
  Scenario: Choosing a provider starts the flow and navigates to the authorization URL
    Given the picker is open
    When I choose the provider "Gmail"
    Then the flow starts via GET /api/external-accounts/oauth2/start?provider=gmail
    And the app navigates to the returned authorizationUrl

  @AC3
  Scenario: The connected account appears in the account switcher and the unified inbox
    Given the provider consent screen was completed
    When the callback returns
    Then the account is listed in the account switcher
    And its folders sync into the unified inbox

  @AC4
  Scenario: The picker and the flow are reachable by keyboard and expose their state
    Given the picker is open
    When I move through the providers with the keyboard and choose one
    Then every provider has a visible focus indicator
    And the state of the flow is exposed to assistive technology
