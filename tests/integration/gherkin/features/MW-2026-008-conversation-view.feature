Feature: MW-2026-008 — Conversation view
  As a user
  I want to view emails grouped by conversation thread
  So that I can follow the full context of an exchange

  Background:
    Given I am logged in as "qa.admin@misfits.fr"
    And there is an email thread with 3 messages

  Scenario: Thread appears as single conversation in inbox
    When I open the inbox
    Then the 3 emails should appear as a single conversation row
    And the row should show the subject, latest sender, and message count "3"

  Scenario: Expanding a conversation shows all messages
    Given I see a conversation with 3 messages
    When I click to expand it
    Then I should see all 3 messages in chronological order
    And each message should show sender, date, and body

  Scenario: Archive conversation from expanded view
    Given I have a conversation expanded
    When I click "Archive"
    Then all 3 messages should be archived
    And the conversation row should disappear from inbox

  Scenario: Delete conversation
    Given I have a conversation expanded
    When I click "Delete"
    Then all 3 messages should be moved to trash
    And the conversation row should disappear from inbox

  Scenario: Reply within conversation
    Given I have a conversation expanded
    When I click "Reply" on the last message
    Then the composer should open with "Re: <subject>" prefilled
    And the reply should be visible in the thread after sending
