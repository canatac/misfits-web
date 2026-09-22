Feature: MW-2026-036 — DKIM service crash loop
  As a system administrator
  I want the DKIM signing service to be stable and operational
  So that all outgoing emails are properly signed with DKIM

  Background:
    Given the DKIM service is configured and running
    And the production server is configured at "mail.misfits.ai"

  Scenario: DKIM service is running and healthy
    When I check the DKIM service status
    Then the service should be in "running" state
    And the service should have been running for at least 60 seconds

  Scenario: DKIM service does not crash on email signing request
    When I send a signing request to the DKIM service
    Then the service should return a valid DKIM signature
    And the service should remain running after the request

  Scenario: DKIM service handles multiple consecutive requests
    When I send 10 consecutive signing requests to the DKIM service
    Then all 10 requests should return valid DKIM signatures
    And the service should not crash or restart during the batch

  Scenario: DKIM signature is valid for outgoing email
    When I send an email via SMTP with DKIM signing
    Then the email should contain a "DKIM-Signature" header
    And the DKIM signature should pass verification

  Scenario: DKIM service recovers automatically after failure
    Given the DKIM service has crashed
    When I wait for the service watchdog to restart it
    Then the service should be running again within 30 seconds
    And the service should successfully sign emails after restart
