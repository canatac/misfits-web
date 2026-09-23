Feature: MW-2026-078 — On-device AI processing
  As a privacy-conscious user
  I want to enable local AI processing
  So that my data never leaves the device for AI operations

  Background:
    Given the user is logged in to mail.misfits.ai
    And the user navigates to Settings > Privacy

  Scenario: Enable local AI mode
    When the user toggles "IA locale" to ON
    Then the setting is saved
    And an "IA local" indicator is visible in the header

  Scenario: AI summary generated on-device
    Given the user has enabled "IA locale"
    When the user opens an email and clicks "Résumé IA"
    Then a summary is generated in under 5 seconds
    And no network request is made to the AI endpoint
    And the summary is displayed in the side panel

  Scenario: No data sent to server for AI
    Given the user has enabled "IA locale"
    When the user triggers an AI operation (summary, triage, or replies)
    Then no email content is sent to the server
    And the AI processing indicator shows "On-device"

  Scenario: API endpoint exists for AI local settings
    When the user sends "GET /api/settings/ai-mode"
    Then the response status is 200 or 401
    And the response body contains a "mode" field with value "local" or "cloud"

  Scenario: API endpoint exists for AI summary
    When the user sends "POST /api/ai/summary"
    Then the response status is 200 or 401
