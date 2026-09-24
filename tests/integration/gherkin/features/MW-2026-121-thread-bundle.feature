Feature: MW-2026-121 — Thread-bundle UI: conversation grouping + collapse/expand
  As a user browsing my inbox
  I want emails grouped into conversation bundles with collapse/expand
  So that I can reduce cognitive load and scroll less

  Background:
    Given I am logged in as admin on "https://mail.misfits.ai"
    And I am on the inbox page "/mail"

  Scenario: Emails are grouped into conversation bundles
    When the inbox loads
    Then related emails should be grouped under a single bundle
    And each bundle should display a counter badge showing the number of emails

  Scenario: Bundle shows collapsed state by default
    When the inbox loads
    Then conversation bundles should be in collapsed state by default
    And only the latest email preview should be visible in each bundle

  Scenario: Clicking a bundle expands it
    When I click on a conversation bundle
    Then the bundle should expand to show all emails in the conversation
    And an animation should play during expansion

  Scenario: Clicking expanded bundle collapses it
    When I click on a conversation bundle to expand it
    And I click the same bundle again
    Then the bundle should collapse back to showing only the latest email

  Scenario: Bundle shows unread indicator
    When a conversation bundle contains unread emails
    Then an unread indicator should be visible on the bundle
    And the counter badge should reflect the unread count

  Scenario: Keyboard shortcut B toggles bundle expansion
    When I focus a conversation bundle
    And I press the "B" key
    Then the bundle should toggle between expanded and collapsed states

  Scenario: Bundle state persists after page refresh
    When I expand a conversation bundle
    And I refresh the page
    Then the expanded state should be preserved in localStorage

  Scenario: Bundle grouping requires authentication
    Given I am not logged in
    When I navigate to "/mail"
    Then I should be redirected to "/login"
    And no conversation bundles should be visible
