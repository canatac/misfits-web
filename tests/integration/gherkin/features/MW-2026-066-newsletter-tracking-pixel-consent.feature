Feature: MW-2026-066 - Newsletter tracking pixel consent
  As a privacy-conscious user
  I want explicit consent before tracking pixels load in newsletters
  So that my email open behavior is not silently shared with senders

  Background:
    Given the user is logged in as admin on https://mail.misfits.ai
    And the inbox contains a newsletter with a tracking pixel

  Scenario: Tracking pixel blocked without consent
    When the user opens a newsletter containing a tracking pixel
    Then the tracking pixel is NOT loaded automatically
    And a consent gate is displayed before pixel activation

  Scenario: User grants tracking consent
    Given the consent gate is visible
    When the user clicks "Allow tracking"
    Then the tracking pixel is loaded
    And the consent choice is logged

  Scenario: User denies tracking consent
    Given the consent gate is visible
    When the user clicks "Block tracking"
    Then the tracking pixel remains blocked
    And the sender does not receive an open notification

  Scenario: Consent preference persisted
    Given the user has previously denied tracking consent
    When the user opens another newsletter from any sender
    Then tracking pixels remain blocked by default
    And no new consent gate is shown for this session

  Scenario: Opt-out available after granting consent
    Given the user previously granted tracking consent
    When the user navigates to privacy settings
    Then an opt-out toggle for newsletter tracking is visible
    When the user disables the toggle
    Then future tracking pixels are blocked
