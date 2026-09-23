Feature: Email Read Receipts (MW-2026-065)
  As a user
  I want to control read receipt sending
  So that I can choose whether recipients know when I've read their emails

  Background:
    Given the user is authenticated
    And the backend is reachable at /api/mail/read-receipts

  Scenario: Toggle read receipt setting via API
    When I send a POST to /api/mail/read-receipts with body {"enabled": true}
    Then the response status should be 200
    And the response should contain "enabled"

  Scenario: Get current read receipt setting
    When I send a GET to /api/mail/read-receipts
    Then the response status should be 200
    And the response should be JSON

  Scenario: Receipt request is user-scoped
    Given user A enables read receipts
    When user B reads their settings
    Then user B should not see user A's preference

  Scenario: MDN generation follows RFC 3798
    Given read receipts are enabled for the sender
    When the recipient opens the email
    Then a Disposition-Notification-To header should be honored

  Scenario: Unauthenticated request is rejected
    Given the user is not authenticated
    When I send a GET to /api/mail/read-receipts
    Then the response status should be 401

  Scenario: Backend unreachable returns 502
    Given the backend is down
    When I send a GET to /api/mail/read-receipts
    Then the response status should be 502

  Scenario: Caddy routes /api/mail* through Next.js
    When a request arrives at Caddy for /api/mail/read-receipts
    Then it should be reverse_proxied to localhost:3001
    And not directly to backend port 8000
