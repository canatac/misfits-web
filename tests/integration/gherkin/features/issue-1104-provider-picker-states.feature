# language: en
Feature: External account connection — provider picker empty, loading and error states
  The provider picker must tell the user what is happening while the provider
  catalogue is fetched, when no provider is available, when the catalogue
  request fails, and when the OAuth2 consent fails or is revoked.

  Background:
    Given the user is signed in
    And the user opens the "Connect an external account" flow

  @AC1
  Scenario: The picker shows a loading state while the provider catalogue is fetched
    Given the provider catalogue request has not returned yet
    When the picker is displayed
    Then the picker shows a loading state while the provider catalogue is fetched

  @AC2
  Scenario: The picker shows an empty state when no provider is available
    Given the provider catalogue returns no provider
    When the picker is displayed
    Then the picker shows an empty state when no provider is available

  @AC3
  Scenario: The picker shows an error state with a retry action when the catalogue request fails
    Given the provider catalogue request fails
    When the picker is displayed
    Then the picker shows an error state with a retry action when the catalogue request fails

  @AC4
  Scenario: A failed or revoked OAuth2 consent returns to the app with a clear message and a way to restart the flow
    Given the user has chosen a provider
    And the OAuth2 consent failed or the token was revoked
    When the user returns to the app
    Then the add-account modal renders the consent error with data-testid oauth2-start-error
    And the modal shows a button named "restart the connection"

  @AC5
  Scenario: Activating the restart button restarts the consent flow
    Given the add-account modal shows the consent error
    When the user activates the button named "restart the connection"
    Then the OAuth2 start is called again for the chosen provider
    And the modal is not only reopened

  @AC6
  Scenario: Each state above has a test
    Given the states loading, empty, error and consent error are implemented
    Then each state above has a test
