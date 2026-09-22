Feature: MW-2026-005 — PWA offline email access
  As a user
  I want to read my recent emails when offline
  So that I can stay productive without connectivity

  Background:
    Given I am logged in as "qa.admin@misfits.fr"
    And the PWA service worker is registered and active
    And the mail page has been visited at least once online

  Scenario: Offline indicator visible when network is down
    Given I am on the mail page
    When the network becomes unavailable
    Then I should see an offline indicator banner
    And the indicator should mention "offline" or "hors ligne"

  Scenario: Recent emails available offline
    Given I have read 5 emails in the last session
    When I navigate to /mail while offline
    Then the inbox should display the 5 most recent emails
    And each email should show subject, sender, and date

  Scenario: Offline actions queued
    Given I am offline
    When I compose a new email and click send
    Then I should see a "queued for sending when online" message
    And the email should appear in the Outbox

  Scenario: Service worker caches mail page
    Given the service worker has activated
    When I request /mail while offline
    Then the response should come from cache
    And the HTTP status should not be a network error
