Feature: MW-2026-065 — Email read receipts (accusés de réception)
  As a sender who wants confirmation their email was received and read
  I want to request a read receipt when composing and see read status in Sent folder
  So that I know when my email was delivered and opened (RFC 3798 MDN)

  Background:
    Given I am logged in as admin on "https://mail.misfits.ai"
    And I am on the compose page

  Scenario: Composer has "Request read receipt" toggle (default off)
    When I open the email composer
    Then I should see a "Request read receipt" toggle or checkbox
    And the toggle should be OFF by default

  Scenario: Sender enables read receipt and sends email
    When I open the email composer
    And I toggle "Request read receipt" to ON
    And I fill in recipient, subject, and body
    And I click Send
    Then the email should be sent successfully
    And the sent email should have read receipt requested flag

  Scenario: Read receipt status visible in Sent folder
    When I navigate to the Sent folder
    And I locate an email with read receipt requested
    Then I should see a delivery status indicator (e.g., "Delivered" or "Sent")
    And if the recipient has read the email, I should see "Read" with a timestamp

  Scenario: MDN (Message Disposition Notification) sent on open
    Given an email with read receipt requested was sent to "qa.pro@misfits.fr"
    When the recipient opens the email
    Then an MDN should be sent back to the sender
    And the sender's Sent folder should update to show "Read" status

  Scenario: No read receipt sent when not requested
    Given I compose an email WITHOUT enabling "Request read receipt"
    When I send the email
    And the recipient opens the email
    Then no MDN should be sent
    And the Sent folder should show only "Delivered" status

  Scenario: API endpoint for read receipt status exists
    When I send a GET request to "/api/mail/read-receipts" with authentication
    Then the response should be 200 or 401 (not 404)
    And if authenticated, it should return read receipt data

  Scenario: Read receipt toggle persists in composer state
    When I open the composer
    And I toggle "Request read receipt" to ON
    And I close and reopen the composer
    Then the toggle should persist its state (ON)
