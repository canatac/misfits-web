Feature: MW-2026-065 — Email read receipts
  As a sender
  I want to request and receive read receipts for my sent emails
  So that I know when my email has been delivered and read

  Background:
    Given I am logged in as "qa.admin@misfits.fr"

  Scenario: Read receipt toggle visible in composer
    When I open the email composer
    Then I should see a "Request read receipt" toggle
    And the toggle should be off by default

  Scenario: Send email with read receipt requested
    Given I have composed an email to "qa.pro@misfits.fr"
    When I enable the "Request read receipt" toggle
    And I click send
    Then the email should be sent successfully
    And the sent email should have read receipt requested

  Scenario: Read receipts list returns valid response
    When I send a GET request to "/api/mail/read-receipts"
    Then the response status should be 200 or 401
    And the response should be valid JSON

  Scenario: Read receipt POST accepts valid payload
    When I send a POST request to "/api/mail/read-receipts" with a valid message ID
    Then the response status should be 200 or 201
    And the response should confirm the read receipt request

  Scenario: Read receipt shows in sent folder after recipient opens
    Given I sent an email with read receipt to "qa.pro@misfits.fr"
    When the recipient opens the email
    Then the sent folder should show "Read" status with a timestamp

  Scenario: MDN (Message Disposition Notification) sent per RFC 3798
    Given a recipient opens an email with read receipt requested
    Then an MDN disposition-notification should be generated
    And the sender should receive the read confirmation
