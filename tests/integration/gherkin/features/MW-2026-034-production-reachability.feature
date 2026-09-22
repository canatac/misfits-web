Feature: MW-2026-034 — Production reachability
  As a system administrator
  I want mail.misfits.ai to be reachable on all required ports
  So that users can access the web UI, send emails via SMTP, and sync via IMAP

  Background:
    Given the production server is configured at "mail.misfits.ai"

  Scenario: HTTPS web interface is reachable
    When I send a GET request to "https://mail.misfits.ai:443"
    Then the response status code should be 200
    And the response body should contain the mail application

  Scenario: SMTP submission port is reachable
    When I attempt a TCP connection to "mail.misfits.ai:587"
    Then the connection should succeed within 10 seconds

  Scenario: IMAP over TLS is reachable
    When I attempt a TCP connection to "mail.misfits.ai:993"
    Then the connection should succeed within 10 seconds

  Scenario: SMTP STARTTLS handshake works
    When I connect to "mail.misfits.ai:587" and issue "EHLO test"
    Then the server should respond with "250" capability list

  Scenario: IMAP greeting banner is received
    When I connect to "mail.misfits.ai:993"
    Then the server should send an IMAP greeting banner
