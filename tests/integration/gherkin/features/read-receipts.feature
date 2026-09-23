Feature: Email read receipts (MW-2026-065)
  As a user sending an email
  I want to request and track read receipts
  So that I know when my email has been read by the recipient

  Background:
    Given the user is authenticated
    And the email composer is open

  Scenario: Enable read receipt in composer
    When I compose a new email
    And I toggle "Request read receipt" in the composer
    And I send the email
    Then the email is sent with MDN (Message Disposition Notification) request header
    And the sent email shows "Read receipt requested" indicator

  Scenario: Read receipt status updates to Delivered
    Given I sent an email with read receipt requested
    When the recipient's mail server confirms delivery
    Then the email status in "Sent" folder changes to "Delivered"
    And a timestamp is shown for the delivery event

  Scenario: Read receipt status updates to Read
    Given I sent an email with read receipt requested
    When the recipient opens the email
    Then the email status in "Sent" folder changes to "Read"
    And a timestamp is shown for the read event

  Scenario: View read receipt timeline
    Given I sent an email with read receipt requested
    When I open the email detail in "Sent" folder
    Then I see a status timeline: Sent → Delivered → Read
    And each step shows the corresponding timestamp

  Scenario: MDN follows RFC 3798 format
    When an MDN is received from the recipient's mail server
    Then the MDN contains "Disposition" header
    And the MDN contains "Original-Message-Id" matching the sent email
    And the MDN action mode is "manual-action/sent-manually"

  Scenario: Security — receipt status only visible to sender
    Given user A sent an email with read receipt
    When user B attempts to access the receipt status via API
    Then the response status is 403 or 404
    And no receipt data is leaked
