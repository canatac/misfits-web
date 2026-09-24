Feature: On-device AI agent email access — local inference, no cloud upload (MW-2026-127)
  As a privacy-conscious user
  I want an AI agent that reads my emails on-device with zero cloud upload
  So that my email data never leaves my device for AI processing

  Background:
    Given the user is logged in to mail.misfits.ai
    And the user has at least one email in their inbox

  Scenario: AI agent mode toggle in privacy settings
    When the user navigates to Privacy Settings
    Then an "AI Agent Mode" toggle is visible
    When the user enables "AI Agent Mode"
    Then the toggle shows active state
    And a privacy indicator confirms "AI processing is local — no data leaves this device"

  Scenario: Agent reads emails locally and suggests actions
    Given the user has enabled AI Agent Mode
    When the user opens an email
    Then the AI agent panel shows suggestions within 5 seconds
    And suggestions include "Reply", "Summarize", "Archive", "Snooze"
    And no network request to external AI APIs is made (verified via network inspection)

  Scenario: Agent suggests replies locally
    Given the user has enabled AI Agent Mode
    When the user opens an email and clicks "AI Suggested Replies"
    Then 3 contextual reply suggestions are displayed
    And clicking a suggestion inserts it into the composer
    And no cloud API call is made during this flow

  Scenario: Agent summarizes email locally
    Given the user has enabled AI Agent Mode
    When the user selects an email and clicks "AI Summary"
    Then a summary is generated and displayed in the side panel
    And the summary appears within 5 seconds
    And no data is sent to external servers

  Scenario: Privacy settings display agent status
    Given the user has enabled AI Agent Mode
    When the user navigates to Privacy Settings
    Then the AI Agent status shows "Active — Processing locally"
    And a green privacy badge is visible
    And the settings show "Zero cloud uploads for AI" confirmation

  Scenario: Agent triage for unread emails
    Given the user has enabled AI Agent Mode
    And the user has 10+ unread emails
    When the user clicks "AI Triage"
    Then emails are sorted by priority locally
    And action suggestions (reply/archive/delete) are shown per email
    And no external API call is made during triage

  Scenario: Disable AI agent mode
    Given the user has enabled AI Agent Mode
    When the user disables "AI Agent Mode" in Privacy Settings
    Then the AI agent panel is hidden
    And all local AI processing stops
    And a confirmation message confirms "AI agent disabled — no local processing"
