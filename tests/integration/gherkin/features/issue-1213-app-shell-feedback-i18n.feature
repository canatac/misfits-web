@issue-1213
Feature: App-shell feedback messages respect i18n settings

  Background:
    Given the app is running with i18n configured with DEFAULT_LOCALE 'fr'

  @AC1 @AC3
  Scenario: All app-shell user-visible strings come from the i18n dictionary
    Given the app shell is rendered
    When I inspect the session toast component in src/components/providers.tsx
    And I inspect the error boundary component in src/lib/error-boundary.ts
    Then every user-visible string in the app shell should be a key in the i18n dictionary
    And no hard-coded user-visible string should exist in the shell components

  @AC2
  Scenario: Welcome toast renders in French and English
    Given the app shell is rendered
    When the user locale is set to 'fr'
    And the user signs in successfully
    Then the welcome toast should display the message from the i18n dictionary for key 'toast.welcomeSignedIn'
    When the user locale is set to 'en'
    And the user signs in successfully
    Then the welcome toast should display the message from the i18n dictionary for key 'toast.welcomeSignedIn'

  @AC2
  Scenario: Error fallback renders in French and English
    Given the app shell is rendered
    When the user locale is set to 'fr'
    And an unhandled error occurs
    Then the error boundary fallback title should display the message from the i18n dictionary for key 'errorBoundary.fallbackTitle'
    And the error boundary fallback message should display the message from the i18n dictionary for key 'errorBoundary.fallbackMessage'
    When the user locale is set to 'en'
    And an unhandled error occurs
    Then the error boundary fallback title should display the message from the i18n dictionary for key 'errorBoundary.fallbackTitle'
    And the error boundary fallback message should display the message from the i18n dictionary for key 'errorBoundary.fallbackMessage'

  @AC4
  Scenario: Each acceptance criterion has a test
    Given the test suite is executed
    Then there should be a test that verifies AC1
    And there should be a test that verifies AC2
    And there should be a test that verifies AC3
    And there should be a test that verifies AC4