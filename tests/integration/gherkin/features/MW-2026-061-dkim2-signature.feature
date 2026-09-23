Feature: MW-2026-061 — DKIM2 signature
  As a security-conscious user
  I want my emails signed with DKIM2 (Ed25519-SHA512)
  So that recipients can verify authenticity with post-quantum resistant signatures

  Background:
    Given the production server "https://mail.misfits.ai" is reachable
    And the DKIM service is operational

  Scenario: DKIM2 signature is present in email headers
    When an authenticated user sends an email via SMTP
    Then the sent email should contain a DKIM2 signature header
    And the DKIM signature should use algorithm ed25519-sha512
    And the DKIM2 badge should be visible in the sent email view

  Scenario: DKIM2 verification by recipient
    When a recipient receives an email signed with DKIM2
    Then the email should pass DKIM2 verification
    And the authentication results header should indicate DKIM2 pass

  Scenario: DKIM1 fallback when recipient doesn't support DKIM2
    When an email is sent to a server that only supports DKIM1
    Then the email should include a DKIM1 signature as fallback
    And the email should still be deliverable

  Scenario: DKIM2 service is not in crash loop
    Given the DKIM service has been restarted
    When an authenticated user sends an email
    Then the email should be signed successfully
    And the DKIM service should remain operational after 3 consecutive sends
