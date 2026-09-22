Feature: MW-2026-032 — Reading mode (HTML sanitize)
  As a user
  I want to read HTML emails in a clean, distraction-free mode
  So that I can focus on content without scripts, trackers, or heavy styling

  Background:
    Given I am logged in as "qa.admin@misfits.fr"
    And I open an HTML email in the email detail view

  Scenario: Reading mode button is visible in email action bar
    When I view an HTML email
    Then I should see a "Reading mode" or "Mode lecture" button in the action bar

  Scenario: Activating reading mode sanitizes HTML content
    Given I am viewing an HTML email with scripts and inline styles
    When I click "Reading mode"
    Then the displayed content should not contain <script> tags
    And the displayed content should not contain inline style attributes
    And the displayed content should not contain iframes

  Scenario: Images are preserved with lazy loading in reading mode
    Given I am viewing an HTML email with images
    When I click "Reading mode"
    Then images should be visible with lazy-loading attribute
    And images should have a placeholder while loading

  Scenario: Reading mode text is formatted for readability
    Given I am in reading mode
    Then the text line-height should be at least 1.5
    And the content max-width should not exceed 800px
    And the font-size should be at least 14px

  Scenario: Toggle back to raw HTML view
    Given I am in reading mode
    When I click the toggle to exit reading mode
    Then the raw HTML email view should be displayed without page reload

  Scenario: Plain text emails do not trigger reading mode
    Given I open a plain text email
    Then the "Reading mode" button should not be visible or should be disabled

  Scenario: No trackers loaded in reading mode
    Given I am in reading mode
    Then no external tracking pixels should be loaded
    And no requests should be made to known tracker domains
