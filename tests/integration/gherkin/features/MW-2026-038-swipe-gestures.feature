Feature: MW-2026-038 — Email triage swipe gestures
  As a mobile user
  I want to swipe left/right on an email to perform quick actions
  So that I can triage my inbox efficiently with touch gestures

  Background:
    Given I am logged in as admin on "https://mail.misfits.ai"
    And I am on the inbox page "/mail"

  Scenario: Swipe right reveals archive action
    When I swipe right on an email in the list
    Then the archive action button should be revealed
    And the button should show the archive icon and "Archiver" label

  Scenario: Swipe right reveals delete action
    When I swipe right past the first threshold on an email
    Then the delete action button should be revealed
    And the button should show the trash icon and "Supprimer" label

  Scenario: Swipe right reveals mark-as-read action
    When I swipe right past the second threshold on an email
    Then the mark-as-read action button should be revealed
    And the button should show the check icon and "Marquer lu" label

  Scenario: Swipe left reveals reply action
    When I swipe left on an email in the list
    Then the reply action button should be revealed
    And the button should show the reply icon and "Répondre" label

  Scenario: Tapping outside dismisses swipe actions
    When I swipe right on an email to reveal actions
    And I tap on the email content area
    Then the swipe actions should be hidden
    And the email should return to its original position

  Scenario: Swipe below threshold does not trigger action
    When I swipe right less than 80px on an email
    Then no action should be triggered
    And the email should return to its original position

  Scenario: Vertical scroll does not trigger swipe
    When I scroll vertically on an email list
    Then no swipe action should be revealed
    And the list should scroll normally
