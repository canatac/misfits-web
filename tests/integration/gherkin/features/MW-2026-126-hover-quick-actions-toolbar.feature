Feature: MW-2026-126 — Email hover quick-actions toolbar
  As a desktop user
  I want a floating toolbar with quick actions to appear when I hover over an email in the list
  So that I can archive, delete, mark as read, snooze, or forward without opening the email

  Background:
    Given I am logged in as admin on "https://mail.misfits.ai"
    And I am on the inbox page "/mail"

  Scenario: Hovering over an email reveals the quick-actions toolbar
    When I hover over an email in the list
    Then a floating toolbar should appear within 200ms
    And the toolbar should contain 5 action buttons: Archive, Delete, Mark read, Snooze, Forward

  Scenario: Toolbar contains Archive action button
    When I hover over an email in the list
    Then the toolbar should display an Archive button with icon and label

  Scenario: Toolbar contains Delete action button
    When I hover over an email in the list
    Then the toolbar should display a Delete button with icon and label

  Scenario: Toolbar contains Mark-as-read action button
    When I hover over an email in the list
    Then the toolbar should display a Mark-as-read button with icon and label

  Scenario: Toolbar contains Snooze action button
    When I hover over an email in the list
    Then the toolbar should display a Snooze button with icon and label

  Scenario: Toolbar contains Forward action button
    When I hover over an email in the list
    Then the toolbar should display a Forward button with icon and label

  Scenario: Toolbar hides when mouse leaves the email row
    When I hover over an email in the list
    And I move the mouse away from the email row
    Then the floating toolbar should be hidden

  Scenario: Toolbar does not appear on touch devices (mobile)
    Given I am on a touch device viewport
    When I long-press on an email in the list
    Then a context menu should appear instead of the hover toolbar

  Scenario: Toolbar actions do not trigger row click
    When I hover over an email in the list
    And I click the Archive button in the toolbar
    Then the email should be archived
    And the email detail view should NOT open

  Scenario: Toolbar is positioned correctly relative to the email row
    When I hover over an email in the list
    Then the toolbar should be aligned to the right side of the email row
    And the toolbar should not overlap adjacent email rows
