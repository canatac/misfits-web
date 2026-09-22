Feature: MW-2026-016 — Newsletter subscription
  As a user
  I want to subscribe to newsletters directly from an email
  So that I can organize my subscriptions and read them in a dedicated folder

  Background:
    Given I am logged in as "qa.admin@misfits.fr"
    And I have received a newsletter email

  Scenario: Subscribe action visible in newsletter email
    When I open a newsletter email
    Then I should see a "Subscribe to newsletter" or "S'abonner" button

  Scenario: Subscribe adds to subscriptions list
    Given I am viewing a newsletter
    When I click "S'abonner"
    Then I should see a confirmation "Subscription added"
    And the newsletter should appear in my subscriptions list

  Scenario: Newsletter emails grouped in dedicated folder
    Given I am subscribed to a newsletter
    When a new edition arrives
    Then it should appear in a "Newsletters" folder
    And not clutter the main inbox

  Scenario: Unsubscribe from newsletter
    Given I am subscribed to a newsletter
    When I open the newsletter
    And I click "Unsubscribe"
    Then the subscription should be removed
    And future editions should go to inbox normally

  Scenario: Subscription list accessible from settings
    Given I have 3 newsletter subscriptions
    When I navigate to Settings > Newsletters
    Then I should see all 3 subscriptions listed
    And I can manage (pause/unsubscribe) each one
