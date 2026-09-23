Feature: Newsletter tracking pixel consent (MW-2026-066)
  As a privacy-conscious user
  I want tracking pixels blocked by default in newsletters
  So that my reading behavior is not tracked without my consent

  Background:
    Given the user is authenticated
    And a newsletter email with tracking pixels is received

  Scenario: Tracking pixels blocked by default
    When I open a newsletter email with embedded tracking pixels
    Then the tracking pixels are NOT loaded
    And the email content displays correctly without tracking requests

  Scenario: Consent gate displayed
    When I open a newsletter email with tracking pixels
    Then a consent banner/gate is displayed
    And the banner explains that tracking pixels were blocked
    And the banner offers "Allow once", "Always allow for this sender", or "Keep blocking" options

  Scenario: Allow tracking pixels once
    When I click "Allow once" on the consent gate
    Then the tracking pixels are loaded for this email only
    And the consent action is logged with timestamp

  Scenario: Always allow for sender
    When I click "Always allow for this sender" on the consent gate
    Then future newsletters from this sender load tracking pixels automatically
    And the sender is added to my allowlist in privacy settings

  Scenario: Keep blocking
    When I click "Keep blocking" on the consent gate
    Then tracking pixels remain blocked
    And the consent gate is dismissed

  Scenario: Opt-out from settings
    When I navigate to Settings > Privacy
    Then I see a "Newsletter tracking" section
    And I can view and manage my sender allowlist
    And I can revoke consent for specific senders

  Scenario: Security — tracking pixel URLs not leaked via referrer
    When a newsletter is displayed
    Then the Referer header does NOT contain email content or user identifiers
    And the Referrer-Policy header is "strict-origin-when-cross-origin"

  Scenario: Consent logged for audit
    When I make a consent choice (allow/block)
    Then the action is logged with: timestamp, sender, action, email_id
    And the log is accessible in privacy settings
