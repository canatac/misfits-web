Feature: MW-2026-004 — Email templates
  As a user
  I want to save and reuse email templates
  So that I can quickly send common messages

  Background:
    Given I am logged in as "qa.admin@misfits.fr"
    And I am on the compose page

  Scenario: Save current email as template
    When I compose an email with subject "Standard Reply" and body "Thank you for your message."
    And I click "Save as Template"
    And I name it "Standard Reply"
    Then I should see a confirmation "Template saved"

  Scenario: Insert template from composer menu
    Given I have a template named "Standard Reply"
    When I open the composer
    And I click "Templates"
    And I select "Standard Reply"
    Then the composer body should contain "Thank you for your message."
