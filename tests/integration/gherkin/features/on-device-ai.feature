Feature: On-device AI processing - local mode (MW-2026-078)
  As a privacy-conscious user
  I want AI features to run locally on my device without sending data to the server
  So that my email content never leaves my device for AI processing

  Background:
    Given the user is authenticated
    And the user opens the settings page

  Scenario: Toggle local AI mode in settings
    When I navigate to settings
    Then a toggle "IA locale" or "Local AI" is visible
    When I enable the "IA locale" toggle
    Then the toggle state is saved
    And an indicator "IA local" is visible in the header

  Scenario: AI summary generated on-device
    Given local AI mode is enabled
    When I open an email and click "Résumé IA"
    Then a summary is generated within 5 seconds
    And no network request is made to the AI API endpoint
    And the summary is displayed in the side panel

  Scenario: AI smart triage works offline
    Given local AI mode is enabled
    And the device is offline
    When I receive new emails
    Then emails are triaged by priority on-device
    And action suggestions (reply/archive/delete) are displayed

  Scenario: AI suggested replies work offline
    Given local AI mode is enabled
    And the device is offline
    When I open an email and click "Réponses suggérées"
    Then 3 contextual reply suggestions are displayed
    And no network request is made

  Scenario: Privacy indicator is visible
    Given local AI mode is enabled
    When I view the main interface
    Then a privacy indicator (lock icon or "IA local") is visible
    And the indicator confirms no data is sent to the server

  Scenario: AI local mode API endpoint exists
    When I send GET /api/ai/local-mode
    Then the response status is 200 or 204
    And the response indicates local AI mode status

  Scenario: AI summary endpoint requires authentication
    Given I am not authenticated
    When I send GET /api/ai/summary
    Then the response status is 307 or 401
    And no summary content is returned

  Scenario: AI local mode state persists across sessions
    Given local AI mode is enabled
    When I reload the page
    Then local AI mode remains enabled
    And the preference is stored in localStorage or IndexedDB
