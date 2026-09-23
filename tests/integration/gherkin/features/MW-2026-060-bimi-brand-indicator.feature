Feature: MW-2026-060 — BIMI brand indicator in inbox
  As a user who receives authenticated emails
  I want to see a brand indicator (BIMI logo) next to emails that pass DMARC
  So that I can visually identify verified senders and trust the email's origin

  Background:
    Given I am logged in as admin on "https://mail.misfits.ai"
    And I am on the inbox page "/mail"
    And the inbox contains at least 1 email with DKIM+SPF+DMARC pass

  Scenario: Authenticated email displays BIMI badge
    When I open an email that passes DKIM+SPF+DMARC authentication
    Then a "Authenticated" badge should be visible in the email header
    And a BIMI logo should be displayed if the sender domain has a valid BIMI record
    And hovering the badge shows a tooltip explaining the authentication status

  Scenario: BIMI logo appears for verified sender domains
    Given an email from a domain with a valid BIMI record (e.g. paypal.com, nytimes.com)
    When I view the email in the inbox list
    Then the sender's BIMI logo should appear next to the sender name
    And the logo should be a square/rectangular brand image

  Scenario: No BIMI logo for domains without BIMI record
    Given an email from a domain without a BIMI record
    When I view the email in the inbox list
    Then no BIMI logo should be displayed
    And a fallback sender avatar or initial should be shown instead

  Scenario: BIMI indicator in email detail view
    When I open an authenticated email
    Then the email detail view should show the BIMI logo near the sender information
    And a verification indicator should show "DKIM: PASS | SPF: PASS | DMARC: PASS"

  Scenario: BIMI logo in inbox list view
    When I view the inbox list
    Then emails from BIMI-enabled domains should display the brand logo inline
    And the logo should be cached to avoid repeated fetches

  Scenario: Tooltip explains BIMI authentication
    When I hover over the BIMI badge or logo
    Then a tooltip should appear with text explaining sender verification
    And the tooltip should mention DMARC, DKIM, and SPF status
