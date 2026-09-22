Feature: MW-2026-036 — DKIM service opérationnel
  As a system administrator
  I want the DKIM signing service to be running and operational
  So that all outbound emails are properly signed with DKIM

  Background:
    Given the DKIM service is deployed on the production server
    And the SMTP relay is configured to use the DKIM service

  Scenario: SMTP port 587 is reachable from outside
    When a client connects to mail.misfits.ai on port 587
    Then the connection should be accepted
    And an SMTP banner should be returned

  Scenario: DKIM service is not in crash loop
    When I check the DKIM service status
    Then the service should be active and running
    And there should be no recent crash/restart cycles in the logs

  Scenario: Email sent via SMTP gets DKIM signature
    When a user sends an email via SMTP port 587
    Then the email should be signed with a DKIM signature
    And the DKIM-Signature header should be present
    And the signature should verify against the public key in DNS

  Scenario: DKIM xml-js dependency is present
    When the DKIM service starts
    Then the xml-js npm module should be resolvable
    And no MODULE_NOT_FOUND error for xml-js should appear in logs

  Scenario: DKIM service survives restart
    When the DKIM service is restarted
    Then it should come back active within 10 seconds
    And it should sign emails correctly after restart
