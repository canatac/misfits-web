Feature: MW-2026-132 — WCAG 3.0 accessibility dashboard
  As a user concerned with accessibility compliance
    I want to view a WCAG 3.0 conformance dashboard in Settings > Accessibility
  So that I can see my Bronze/Silver/Gold score, non-conformant criteria, and remediation plan

  Background:
    Given I am logged in as admin on "https://mail.misfits.ai"
    And I am on the inbox page "/mail"

  Scenario: Accessibility section exists in Settings
    When I open the Settings page
    And I navigate to the Accessibility section
    Then I should see an accessibility dashboard heading

  Scenario: WCAG 3.0 conformance score is displayed
    When I open the Accessibility dashboard
    Then I should see a conformance score indicator (Bronze, Silver, or Gold)
    And the score should be visually prominent

  Scenario: Non-conformant criteria are listed
    When I open the Accessibility dashboard
    Then I should see a list of WCAG 3.0 criteria that are not yet conformant
    And each criterion should show its status (non-conformant, partial, or conformant)

  Scenario: Remediation plan is visible
    When I open the Accessibility dashboard
    Then I should see a remediation plan with actionable steps
    And the plan should reference the non-conformant criteria

  Scenario: WCAG 3.0 draft tracking is indicated
    When I open the Accessibility dashboard
    Then I should see an indicator that WCAG 3.0 draft is being tracked
    And the tracking status should be visible

  Scenario: Score persists in localStorage
    When I open the Accessibility dashboard
    And the dashboard loads my conformance score
    Then the score should be saved in localStorage
    And on next page load the score should be restored without recalculation
