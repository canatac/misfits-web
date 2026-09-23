Feature: Pro plan subscription billing (MW-2026-077)
  As a free user
  I want to subscribe to the Pro plan
  So that I get 50GB storage, custom domain, AI features, and unlimited aliases

  Background:
    Given the pricing page is accessible at "/pricing"
    And the user is authenticated as a free plan user

  Scenario: Pricing page displays plan comparison
    When I navigate to "/pricing"
    Then the page shows a "Free" plan with "5GB" storage
    And the page shows a "Pro" plan with "€3/mo" pricing
    And the Pro plan lists "50GB storage", "custom domain", "AI features", "unlimited aliases"

  Scenario: Subscribe to Pro plan via Stripe
    Given I am on the pricing page
    When I click "Subscribe to Pro"
    Then I am redirected to the Stripe checkout page
    And the checkout shows "€3/mo" amount

  Scenario: Pro features activated after successful payment
    Given I have completed the Stripe payment
    When the payment webhook confirms success
    Then my account plan is upgraded to "Pro"
    And I see a confirmation message "Welcome to Pro!"
    And the "50GB" storage limit is active

  Scenario: Invoice generated and sent by email
    Given my Pro subscription is active
    When I navigate to "Billing" in settings
    Then I see an invoice with date, amount "€3.00", and plan "Pro"
    And a PDF download link is available
    And a confirmation email is sent to my address

  Scenario: Security — unauthenticated user cannot access billing API
    Given I am not authenticated
    When I send GET /api/billing/invoices
    Then the response status is 307 or 401
    And no billing data is leaked
