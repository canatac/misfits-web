Feature: MW-2026-069 — Pricing plan Pro 5 EUR/mo
  As a user
  I want to subscribe to the Pro plan at 5 EUR/mo with 60GB, custom domain, and on-device AI
  So that I can access premium features positioned between Tuta 3 EUR and Fastmail 5 USD

  Background:
    Given I am logged in as admin on "https://mail.misfits.ai"
    And I am on the pricing or settings page

  Scenario: Pricing page displays Pro plan at 5 EUR/mo
    When I navigate to the pricing page
    Then the Pro plan should be displayed with price "5 EUR/mo"
    And it should list "60GB storage" as a feature
    And it should list "Custom domain" as a feature
    And it should list "On-device AI" as a feature
    And the Pro plan should be positioned between the Free and Enterprise tiers

  Scenario: User can initiate Pro plan subscription
    When I click on the Pro plan subscribe button
    Then a payment flow should be initiated
    And I should see the subscription details before confirming

  Scenario: Successful Pro plan payment activates features
    When I complete the payment for the Pro plan
    Then the payment should be accepted
    And the Pro features should be activated for my account
    And a confirmation or invoice should be generated

  Scenario: Pro plan includes custom domain support
    When I have an active Pro subscription
    And I navigate to domain settings
    Then I should be able to add and verify a custom domain
    And emails should be sendable from my custom domain

  Scenario: Pro plan includes on-device AI
    When I have an active Pro subscription
    And I activate the local AI mode
    Then AI processing should be performed on my device
    And no email content should be sent to the server for AI processing

  Scenario: Pro plan includes 60GB storage
    When I have an active Pro subscription
    Then my storage quota should be 60GB
    And I should be able to store up to 60GB of emails and attachments

  Scenario: Invoice generation after Pro subscription
    When I subscribe to the Pro plan
    Then an invoice should be generated
    And the invoice should show "5 EUR/mo" amount
    And the invoice should be accessible from my account settings
