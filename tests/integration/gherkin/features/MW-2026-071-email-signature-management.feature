Feature: MW-2026-071 — Email signature management
  As a user
  I want to create and manage email signatures in settings
  So that my outgoing emails automatically include a professional signature

  Background:
    Given I am logged in as admin on "https://mail.misfits.ai"
    And I navigate to settings "/settings"

  Scenario: Signature settings page is accessible
    When I navigate to the signature settings section
    Then the signature editor should be visible
    And a rich text editor should be present

  Scenario: User can create a rich text signature
    Given I am on the signature settings page
    When I type "Best regards, John Doe" in the signature editor
    And I apply bold formatting to "Best regards"
    And I save the signature
    Then a confirmation "Signature saved" should appear
    And the signature should persist on page reload

  Scenario: Signature preview is visible
    Given I have saved a signature "Best regards, John Doe"
    When I view the signature preview
    Then the preview should render the rich text formatting
    And the preview should match the saved content

  Scenario: Signature auto-appears in composer
    Given I have saved a signature "Best regards, John Doe"
    When I open the email composer via "Compose"
    Then the composer body should contain "Best regards, John Doe"
    And the signature should appear at the bottom of the body

  Scenario: Signature appears in new email by default
    Given I have saved a signature "Sent from Misfits Mail"
    When I click "Compose" to create a new email
    And I type "Test body" in the composer
    Then the email body should end with "Sent from Misfits Mail"

  Scenario: User can edit an existing signature
    Given I have saved a signature "Old signature"
    When I navigate to the signature settings page
    And I clear the editor
    And I type "New signature" in the editor
    And I save the signature
    Then the updated signature should be "New signature"
    And the old signature "Old signature" should no longer appear

  Scenario: User can disable signature
    Given I have saved a signature "My signature"
    When I toggle the signature activation switch to "off"
    And I open the email composer
    Then the composer body should not contain "My signature"
