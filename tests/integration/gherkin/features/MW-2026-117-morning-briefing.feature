Feature: MW-2026-117 — Morning Briefing on-device daily digest
  As a user starting my day
  I want to see a digest of important emails and events
  So that I can quickly catch up without scrolling through my inbox

  Background:
    Given I am logged in as admin on "https://mail.misfits.ai"
    And I am on the inbox page "/mail"

  Scenario: Morning Briefing card is visible on inbox
    When the page loads
    Then a "Morning Briefing" section or card should be visible
    And it should show a summary of recent important emails

  Scenario: Briefing shows email count
    When the Morning Briefing loads
    Then it should display the number of unread emails
    And it should display the number of emails requiring action

  Scenario: Briefing shows today's events
    When the Morning Briefing loads
    Then it should display calendar events for today
    And each event should show the time and title

  Scenario: Briefing updates on refresh
    When I receive a new email
    And I refresh the Morning Briefing
    Then the new email should appear in the digest
    And the unread count should be incremented

  Scenario: On-device processing — no server data leak
    When the Morning Briefing is generated
    Then the digest should be processed locally
    And no email content should be sent to external servers

  Scenario: Security — briefing requires authentication
    Given I am not logged in
    When I attempt to access the Morning Briefing API
    Then the response should be 401 Unauthorized
    And no email data should be returned
