Feature: MW-2026-103 — On-device AI privacy mode (local processing)
  As a privacy-conscious user
  I want to enable on-device AI processing so that my email data never leaves my device
  So that AI features (summary, triage, replies) work locally without sending data to the server

  Background:
    Given I am logged in as admin on "https://mail.misfits.ai"
    And I am on the settings page "/settings"
    And the AI features section is visible

  Scenario: Enabling on-device AI mode in settings
    When I navigate to the AI settings section
    And I toggle the "On-device AI processing" switch to ON
    Then a confirmation dialog should appear explaining that AI processing will happen locally
    And after confirming, the toggle should remain ON
    And a badge or indicator should show "Local AI active" in the UI

  Scenario: AI summary works in local mode
    Given on-device AI mode is enabled
    When I open an email
    And I click the "AI Summary" button
    Then a summary should be generated
    And a "processed locally" indicator should be visible
    And no network request to the AI API endpoint should contain email body content

  Scenario: AI smart triage works in local mode
    Given on-device AI mode is enabled
    When I navigate to the inbox with unread emails
    And I trigger the "Smart Triage" action
    Then emails should be sorted by priority
    And action suggestions should be displayed
    And a "processed locally" badge should be visible

  Scenario: Disabling on-device AI mode
    Given on-device AI mode is enabled
    When I toggle the "On-device AI processing" switch to OFF
    Then the toggle should be OFF
    And AI features should revert to server-side processing
    And the "Local AI active" indicator should disappear

  Scenario: On-device mode persists across sessions
    Given on-device AI mode is enabled
    When I log out and log back in
    And I navigate to the AI settings
    Then the "On-device AI processing" toggle should still be ON

  Scenario: Performance indicator for local processing
    Given on-device AI mode is enabled
    When I generate an AI summary
    Then the processing time should be displayed
    And a "Local processing" label should appear alongside the result
