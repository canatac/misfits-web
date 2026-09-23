Feature: MW-2026-066 — Newsletter tracking pixel consent
  As a privacy-conscious user reading newsletters
  I want tracking pixels blocked by default and a consent gate before activation
  So that my open behavior is not tracked without explicit consent (GDPR compliance)

  Background:
    Given I am logged in as admin on "https://mail.misfits.ai"
    And I am viewing a newsletter email that contains tracking pixels

  Scenario: Tracking pixels are blocked by default in newsletters
    When I open a newsletter email with embedded tracking pixels
    Then external tracking pixel requests should NOT be fired automatically
    And a consent banner should be displayed asking for permission to load external content

  Scenario: Consent gate blocks tracking until user approves
    When I open a newsletter email with tracking pixels
    And I have NOT given consent
    Then the tracking pixel endpoints should not be called
    And the email content should display with a placeholder for external images

  Scenario: User grants consent and tracking pixels load
    When I open a newsletter email with tracking pixels
    And I click "Afficher les images" or "Autoriser le contenu externe"
    Then tracking pixels should be loaded
    And the consent choice should be persisted for future sessions

  Scenario: User denies consent and tracking remains blocked
    When I open a newsletter email with tracking pixels
    And I click "Refuser" or "Bloquer les images"
    Then tracking pixels should remain blocked
    And the consent denial should be logged
    And the user should see an option to change this in privacy settings

  Scenario: Privacy settings allow consent opt-out management
    Given I previously granted consent for newsletter tracking
    When I navigate to the privacy settings page
    Then I should see a "Newsletter tracking" section
    And I should be able to revoke consent
    And revoking consent should block tracking pixels on next newsletter open

  Scenario: API endpoint exists for newsletter consent preferences
    When I send GET /api/preferences
    Then the response should be 200
    And the response body should contain a "newsletterTrackingConsent" field
    When I send POST /api/newsletters/consent with body {"consent": true}
    Then the response should be 200
    And the consent preference should be persisted

  Scenario: Anonymous users cannot access newsletter consent API
    Given I am NOT logged in
    When I send GET /api/newsletters
    Then the response should be 401
    When I send GET /api/preferences
    Then the response should be 401
