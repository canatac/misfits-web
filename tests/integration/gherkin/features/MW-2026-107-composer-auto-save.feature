Feature: MW-2026-107 — Email composer auto-save drafts
  As a user composing an email
  I want my draft to be saved automatically every 5 seconds
  So that I don't lose my work if I close the tab accidentally

  Background:
    Given I am logged in as admin on "https://mail.misfits.ai"
    And I am on the inbox page "/mail"

  Scenario: Auto-save indicator appears while composing
    When I open the email composer
    And I type "Test auto-save subject" in the subject field
    And I type "Test auto-save body content" in the body field
    And I wait for 6 seconds
    Then a "Draft saved" indicator should be visible in the composer
    And the indicator should show a timestamp

  Scenario: Draft is restored after closing and reopening composer
    When I open the email composer
    And I type "Draft restoration test" in the subject field
    And I type "This draft should be restored" in the body field
    And I wait for 6 seconds
    And I close the composer
    And I reopen the composer
    Then the subject field should contain "Draft restoration test"
    And the body field should contain "This draft should be restored"

  Scenario: Delete draft button is available
    When I open the email composer
    And I type "Draft to delete" in the subject field
    And I wait for 6 seconds
    Then a "Delete draft" button should be visible in the composer
    When I click the "Delete draft" button
    Then the composer fields should be cleared

  Scenario: Drafts folder lists saved drafts
    When I open the email composer
    And I type "Listed draft subject" in the subject field
    And I wait for 6 seconds
    And I close the composer
    And I navigate to the "Drafts" folder
    Then the draft "Listed draft subject" should be visible in the drafts list
