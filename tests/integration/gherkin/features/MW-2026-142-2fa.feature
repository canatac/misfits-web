Feature: Two-factor authentication (MW-2026-142 / issue #1055)
  Users can secure their account with TOTP and FIDO2/WebAuthn security keys,
  and recover access with single-use recovery codes.

  Background:
    Given the source file "src/app/settings/security/_components/two-factor-section.tsx" is loaded
    And the source file "src/hooks/use-two-factor.ts" is loaded
    And the source file "src/app/settings/security/_components/__tests__/two-factor-section.test.tsx" is loaded

  Scenario: TOTP QR setup
    Given the source file "src/app/settings/security/_components/two-factor-section.tsx" is loaded
    Then the settings section shows a QR code for the authenticator app
    And the settings section shows the manual setup key

  Scenario: Activation with valid code and recovery codes
    Given the source file "src/app/settings/security/_components/__tests__/two-factor-section.test.tsx" is loaded
    Then activating with a 6-digit code calls the activate function with that code
    And a code shorter than 6 digits disables the enable button
    And the section shows the recovery codes once 2FA is enabled

  Scenario: Login requiring the 2FA code
    Given the source file "src/app/settings/security/_components/two-factor-section.tsx" is loaded
    Then the verification code input uses one-time-code autocomplete
    And the verification code input requires exactly 6 digits

  Scenario: FIDO2/WebAuthn security key
    Given the source file "src/app/settings/security/_components/two-factor-section.tsx" is loaded
    Then the settings section offers a security key registration button
    And the security key registration calls navigator.credentials.create with a publicKey
    And the registered credential is sent to the registration finish endpoint

  Scenario: New-login email notification
    Given the source file "src/hooks/use-two-factor.ts" is loaded
    Then the 2FA status includes whether WebAuthn is enabled
    And the status request reports a failed request as an error

  Scenario: 2FA deactivation
    Given the source file "src/app/settings/security/_components/two-factor-section.tsx" is loaded
    Then the enabled section shows a disable button
    And clicking disable calls the deactivate function

  Scenario: Recovery codes at login
    Given the source file "src/app/settings/security/_components/two-factor-section.tsx" is loaded
    Then the recovery codes are shown with the warning that each code can be used once
