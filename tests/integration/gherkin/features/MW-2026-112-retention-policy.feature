Feature: MW-2026-112 — Email metadata retention policy
  As a user
  I want to configure a retention policy for my email metadata
  So that old data is automatically purged per GDPR Article 5

  Background:
    Given the production server is running at "https://mail.misfits.ai"

  Scenario: Retention settings page requires authentication
    Given I am not authenticated
    When I navigate to "/settings/retention"
    Then the response status should be 307
    And I should be redirected to "/login"

  Scenario: Retention API requires authentication
    Given I am not authenticated
    When I send a GET request to "/api/settings/retention"
    Then the response status should be 307 or 401 or 404

  Scenario: Retention API POST requires authentication
    Given I am not authenticated
    When I send a POST request to "/api/settings/retention" with body '{"days": 90}'
    Then the response status should be 307 or 401 or 404

  Scenario: Audit log endpoint requires authentication
    Given I am not authenticated
    When I send a GET request to "/api/admin/audit-log"
    Then the response status should be 307 or 401 or 404
