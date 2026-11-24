# Scenarios for misfits-web#1172 - Unified inbox: empty state after a successful account connection.
# AC1: An empty unified inbox shows a distinct state for 'syncing', 'no mail yet' and 'connection failed'
# AC2: The syncing state is announced to assistive technology through a live region
# AC3: Each state has a test

Feature: Unified inbox empty state after a successful account connection
  After a user connects an account (OAuth2 consent return or manual save) and lands back on the
  unified inbox, it may be empty while the first sync runs. The empty state must tell 'syncing',
  'no mail yet' and 'connection failed' apart.

  Background:
    Given a user has connected an account
    And the user lands back on the unified inbox

  @AC1
  Scenario: Empty unified inbox shows the syncing state
    Given the first sync of the connected account is still running
    Then the unified inbox shows a distinct empty state for 'syncing'

  @AC1
  Scenario: Empty unified inbox shows the no mail yet state
    Given the sync of the connected account has finished and found no messages
    Then the unified inbox shows a distinct empty state for 'no mail yet'

  @AC1
  Scenario: Empty unified inbox shows the connection failed state
    Given the connection of the connected account has failed
    Then the unified inbox shows a distinct empty state for 'connection failed'

  @AC2
  Scenario: The syncing state is announced to assistive technology
    Given the first sync of the connected account is still running
    Then the syncing empty state is announced to assistive technology through a live region

  @AC3
  Scenario: Each empty state has a test
    Given the empty states 'syncing', 'no mail yet' and 'connection failed'
    When the test suite runs
    Then each state has a test
