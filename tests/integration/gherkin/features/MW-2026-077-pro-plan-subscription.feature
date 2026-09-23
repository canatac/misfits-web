Feature: MW-2026-077 — Pro plan subscription billing
  As a free user
  I want to subscribe to the Pro plan
  So that I can access premium features (50GB, custom domain, AI, unlimited aliases)

  Background:
    Given the user is logged in to mail.misfits.ai
    And the user is on the free plan

  Scenario: View pricing page
    When the user navigates to Settings > Subscription
    Then a pricing comparison is displayed
    And the Free plan shows "5GB storage"
    And the Pro plan shows "50GB storage, custom domain, AI, unlimited aliases"
    And the Pro plan price is "€3/month"

  Scenario: Subscribe to Pro plan
    When the user selects the Pro plan
    And completes the payment via Stripe
    Then the payment is accepted
    And the user's plan changes to "Pro"
    And Pro features are activated immediately
    And a confirmation email is sent

  Scenario: Invoice generation after subscription
    Given the user has just subscribed to the Pro plan
    Then a PDF invoice is generated
    And the invoice contains the plan name, price, and date
    And the invoice is available for download

  Scenario: API endpoint exists for subscription
    When the user sends "GET /api/subscription"
    Then the response status is 200 or 401
    And the response body contains a "plan" field

  Scenario: API endpoint exists for checkout
    When the user sends "POST /api/subscription/checkout"
    Then the response status is 200 or 401
    And the response body contains a "checkout_url" or "client_secret" field
