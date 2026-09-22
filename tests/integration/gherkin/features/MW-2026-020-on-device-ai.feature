Feature: MW-2026-020 — On-device AI processing
  As a user
  I want AI processing to happen locally on my device
  So that my data stays private and works offline

  Background:
    Given I am logged in as "qa.admin@misfits.fr"
    And I have enabled "Local AI" mode in settings

  Scenario: Local AI mode toggle in settings
    When I navigate to Settings > Privacy
    Then I should see a "Local AI processing" toggle
    And it should be off by default

  Scenario: Enabling local AI mode
    Given the local AI toggle is off
    When I enable it
    Then I should see a confirmation that AI processing is now local
    And a download prompt for the AI model

  Scenario: AI summary works offline when local mode enabled
    Given local AI mode is enabled
    And the AI model is downloaded
    When I generate an email summary
    Then no data should leave my device
    And the summary should be generated locally

  Scenario: Cloud AI disabled in local mode
    Given local AI mode is enabled
    When I perform AI actions
    Then the browser should not make API calls to AI endpoints
    And all processing should be done via WebAssembly or Web Worker

  Scenario: Storage indicator for local model
    Given the AI model is downloaded
    When I check storage settings
    Then I should see the model size listed (e.g., "AI Model: 500MB")
