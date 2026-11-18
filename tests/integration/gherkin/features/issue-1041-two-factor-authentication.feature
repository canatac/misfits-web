# Language: en
# QA scenarios for misfits-web issue #1041 — Two-factor authentication (2FA): TOTP + FIDO2/WebAuthn.
# One Scenario per acceptance criterion, tagged with its number (@AC1..@AC9).
# Matrix row: MW-2026-142.

Feature: Two-factor authentication (2FA) — TOTP + FIDO2/WebAuthn
  As a security-conscious user of misfits.ai Mail
  I want to protect my account with two-factor authentication
  So that my account stays safe even if my password is compromised

  @AC1
  Scenario: AC1 — Activation 2FA dans Settings > Security > Two-Factor Authentication
    Given a signed-in user
    When the user opens "Settings > Security > Two-Factor Authentication"
    Then an activation control for two-factor authentication is available
    And activating it starts the 2FA setup

  @AC2
  Scenario: AC2 — Scan QR code + saisie code TOTP pour vérification
    Given the user has started the 2FA activation
    When a QR code is displayed for the user to scan with a TOTP application
    And the user enters the TOTP code shown by that application
    Then the TOTP code is verified
    And the 2FA activation is confirmed

  @AC3
  Scenario: AC3 — 10 codes de récupération générés à l'activation
    Given the user has activated 2FA
    When the activation completes
    Then 10 single-use recovery codes are generated and displayed to the user

  @AC4
  Scenario: AC4 — Login avec 2FA : mot de passe + code TOTP
    Given a user has 2FA activated
    When the user signs in with the correct password
    Then the user is asked for a TOTP code
    And signing in with the correct TOTP code completes the login

  @AC5
  Scenario: AC5 — Option FIDO2/WebAuthn pour clés matérielles (YubiKey, etc.)
    Given the user has started the 2FA activation
    When the user chooses a FIDO2/WebAuthn security key (YubiKey, etc.)
    And the security key registration succeeds
    Then the security key is available as a second factor for login

  @AC6
  Scenario: AC6 — Email de notification pour nouvelle connexion
    Given a user has 2FA activated
    When the user signs in from a new device
    Then a notification email is sent to the user's email address

  @AC7
  Scenario: AC7 — Toute dépendance ajoutée à package.json est accompagnée de pnpm-lock.yaml régénéré
    Given the pull request adds a dependency to package.json
    When the CI runs on the pull request
    Then pnpm-lock.yaml is regenerated and committed alongside it
    And the CI does not fail with ERR_PNPM_OUTDATED_LOCKFILE

  @AC8
  Scenario: AC8 — Le lockfile est régénéré avec la version de pnpm du projet et committé dans la même pull request que le changement de package.json
    Given the pull request changes package.json
    When the lockfile is regenerated
    Then it is regenerated with the pnpm version of the project
    And it is committed in the same pull request as the package.json change

  @AC9
  Scenario: AC9 — La CI (Lint + Typecheck + Test) est verte sur la pull request, sans modifier .github/
    Given the pull request is open
    When the CI runs Lint, Typecheck and Test
    Then all three checks are green
    And no file under .github/ is modified by the pull request
