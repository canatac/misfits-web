Feature: MW-2026-102 — NIS2/DORA/GDPR unified compliance
  As a compliance officer
  I want a single control set that maps GDPR Art.32 + NIS2 security measures + DORA ICT risk
  So that email authentication (SPF/DKIM/DMARC/MTA-STS) satisfies all 3 regulatory frameworks with a unified audit report

  Background:
    Given the email infrastructure is configured with SPF, DKIM, DMARC, and MTA-STS
    And the compliance audit endpoint is available

  Scenario: SPF record is published and valid
    When I query the DNS for the domain's SPF record
    Then a valid TXT record starting with "v=spf1" should exist
    And the record should include all authorized sending IPs
    And the record should not exceed the 10-DNS-lookup limit

  Scenario: DKIM signature is present on outbound emails
    When an email is sent via SMTP
    Then the email headers should contain a "DKIM-Signature" header
    And the DKIM signature should use at least RSA-2048 or Ed25519
    And the DKIM verification should pass for the domain

  Scenario: DMARC policy is published and enforced
    When I query the DNS for the domain's DMARC record
    Then a valid TXT record at "_dmarc.<domain>" should exist
    And the policy should be at minimum "p=none"
    And the record should include a valid reporting email (rua)

  Scenario: MTA-STS policy is published
    When I check for MTA-STS support
    Then a policy file should be accessible at "https://mta-sts.<domain>/.well-known/mta-sts.txt"
    And the policy should contain "enforce" mode (not "testing")
    And the policy should include a valid max-age of at least 86400 seconds

  Scenario: Unified compliance report covers all 3 frameworks
    When I request the compliance audit report
    Then the report should include a GDPR Art.32 section covering encryption and access controls
    And the report should include an NIS2 section covering security measures and incident reporting
    And the report should include a DORA section covering ICT risk management and resilience
    And the email authentication controls (SPF/DKIM/DMARC/MTA-STS) should be mapped to all 3 frameworks

  Scenario: TLS encryption for all email transport
    When an email is sent or received
    Then the SMTP connection should use STARTTLS or implicit TLS
    And the certificate should be valid (not expired, correct CN/SAN)
    And TLS 1.2 or higher should be negotiated
