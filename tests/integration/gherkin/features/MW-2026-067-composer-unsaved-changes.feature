Feature: MW-2026-067 — Composer unsaved changes indicator
  As a user composing an email
  I want a clear visual indicator when I have unsaved changes and a confirmation modal when navigating away
  So that I don't accidentally lose my draft work

  Background:
    Given I am logged in as admin on "https://mail.misfits.ai"
    And I am on the inbox page "/mail"
    And I open the composer (click "Compose" or press "C")

  Scenario: Typing in composer triggers unsaved changes indicator
    When I type "Test subject" in the composer subject field
    And I type "Test body content" in the composer body field
    Then a visual indicator (dot or icon) should appear showing unsaved changes
    And the indicator should be visible in the composer header or navigation area

  Scenario: Navigating away with unsaved changes shows confirmation modal
    When I type "Draft subject" in the composer subject field
    And I type "Draft body" in the composer body field
    And I attempt to navigate away (click inbox link or press Escape)
    Then a modal "You have unsaved changes" should appear
    And the modal should contain buttons: [Save draft] [Discard] [Cancel]

  Scenario: Modal "Save draft" saves and navigates away
    When I type "Save me" in the composer subject field
    And I attempt to navigate away
    And I click "Save draft" in the modal
    Then the draft should be saved
    And I should navigate to the target page
    And the unsaved changes indicator should disappear

  Scenario: Modal "Discard" discards and navigates away
    When I type "Discard me" in the composer subject field
    And I attempt to navigate away
    And I click "Discard" in the modal
    Then the draft should be discarded
    And I should navigate to the target page

  Scenario: Modal "Cancel" keeps user in composer
    When I type "Keep me" in the composer subject field
    And I attempt to navigate away
    And I click "Cancel" in the modal
    Then the modal should close
    And I should remain in the composer
    And the unsaved text should still be present

  Scenario: Draft auto-saves to localStorage every 10 seconds
    When I type "Auto-save test" in the composer subject field
    And I wait 10 seconds
    Then the draft should be saved to localStorage
    And a visual confirmation or the draft timestamp should update

  Scenario: Draft recovery on accidental browser close
    When I type "Recovery test" in the composer subject field
    And the draft is auto-saved to localStorage
    And I reopen the composer
    Then the previously typed content should be recovered from localStorage
    Or a "Restore draft" prompt should appear

  Scenario: No indicator when composer is empty and untouched
    Given the composer is open and empty
    And I have not typed anything
    Then no unsaved changes indicator should be visible

  Scenario: Indicator clears after successful send
    When I type a valid recipient and subject and body
    And I click "Send"
    And the email is sent successfully
    Then the unsaved changes indicator should disappear
    And the composer should close or reset
