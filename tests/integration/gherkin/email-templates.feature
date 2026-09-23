Feature: Email templates CRUD + composer integration
  As a user
  I want to create, manage and reuse email templates
  So that I can respond faster to common requests

  Background:
    Given I am logged in
    And I open the composer

  Scenario: Create a new template
    When I click "Templates" in the composer
    And I click "New template"
    And I fill in template name "Standard reply"
    And I fill in template subject "Re: Your inquiry"
    And I fill in template body "Thank you for your message..."
    And I click "Save template"
    Then the template "Standard reply" appears in the template list

  Scenario: Insert a template into the composer
    Given a template "Standard reply" exists
    When I click "Templates" in the composer
    And I click "Standard reply"
    Then the composer subject is "Re: Your inquiry"
    And the composer body contains "Thank you for your message..."

  Scenario: Edit an existing template
    Given a template "Standard reply" exists
    When I click "Templates" in the composer
    And I click "Edit" on "Standard reply"
    And I change the body to "Updated response"
    And I click "Save template"
    Then the template "Standard reply" has body "Updated response"

  Scenario: Delete a template
    Given a template "Standard reply" exists
    When I click "Templates" in the composer
    And I click "Delete" on "Standard reply"
    And I confirm the deletion
    Then the template "Standard reply" no longer appears in the list

  Scenario: Templates are synced across devices
    Given I have created a template "Standard reply" on device A
    When I log in on device B
    And I open the composer
    And I click "Templates"
    Then the template "Standard reply" appears in the template list
