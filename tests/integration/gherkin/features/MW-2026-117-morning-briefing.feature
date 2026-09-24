Feature: MW-2026-117 — Morning Briefing on-device daily digest
  As a user opening my inbox
  I want to see a Morning Briefing card with my unread count and today's calendar events
  So that I can quickly understand my day without leaving the app

  Background:
    Given I am logged in as admin on "https://mail.misfits.ai"
    And I am on the inbox page "/mail"

  Scenario: Morning Briefing card is visible on inbox
    When the inbox loads
    Then a Morning Briefing card or section should be visible
    And it should show the unread email count
    And it should show today's calendar events if any

  Scenario: Morning Briefing shows unread count
    When the inbox loads
    Then the Morning Briefing should display a numeric unread count
    And the count should be greater than or equal to zero

  Scenario: Morning Briefing updates on new email arrival
    When a new email arrives in the inbox
    Then the Morning Briefing unread count should increment
    And the card should update without a full page reload

  Scenario: Morning Briefing processes data locally
    When the Morning Briefing card loads
    Then no email content or calendar data should be sent to external servers
    And the processing should happen on-device

  Scenario: Morning Briefing shows calendar events
    When the inbox loads
    And I have calendar events scheduled for today
    Then the Morning Briefing should list today's events
    And each event should show time and title
