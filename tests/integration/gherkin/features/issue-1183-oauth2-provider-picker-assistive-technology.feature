Feature: OAuth2 provider picker announces its state to assistive technology
  The Add Account provider picker (src/components/mail/add-account-modal/oauth2-provider-picker.tsx) is fed by useOAuth2Providers(open). Its loading, error and empty states are visual only: a screen reader user who opens the picker gets no announcement, and the retry action is not tied to the error by an accessible relationship.

  Background:
    Given the user has opened the Add Account provider picker

  @AC1
  Scenario: Loading, error and empty states are announced through a live region
    When the provider catalogue is loading
    Then the loading state is announced to assistive technology through a live region
    When the provider catalogue fails to load
    Then the error state is announced to assistive technology through a live region
    When the provider catalogue returns no provider
    Then the empty state is announced to assistive technology through a live region

  @AC2
  Scenario: Retry action has an accessible name naming the provider catalogue
    Given the provider catalogue failed to load
    When the retry action is exposed in the error state
    Then its accessible name names the provider catalogue

  @AC3
  Scenario: Picker is operable from the keyboard with a visible focus indicator on every provider
    Given the provider picker lists providers
    When the user operates the picker from the keyboard alone
    Then every provider is reachable without the pointer
    And every provider shows a visible focus indicator

  @AC4
  Scenario: Each state has a test
    Given the loading, error and empty states of the provider picker
    Then each state has a test
