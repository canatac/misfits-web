# language: fr
# Scenarios of issue #1046 — URL phishing detection and link safety scanning
# One Scenario per acceptance criterion, tagged with its number.

Feature: URL phishing detection and link safety scanning
  Incoming emails are scanned for suspicious URLs, the user is warned,
  and the scan can be turned off.

  Background:
    Given an email whose body contains the URLs "https://banque-officielle.example.com/" and "https://login-secure.example.net/verify"

  @AC1
  Scenario: URLs are extracted from the email body (HTML and text)
    Given an incoming email whose HTML body contains the link "https://login-secure.example.net/verify"
    And whose text body contains the link "https://banque-officielle.example.com/"
    When the URLs of the email body are scanned
    Then the extracted URL list contains "https://login-secure.example.net/verify"
    And the extracted URL list contains "https://banque-officielle.example.com/"

  @AC2
  Scenario: Reputation is checked for each unique URL
    Given an incoming email whose body contains the URL "https://login-secure.example.net/verify" twice
    When the reputation of the extracted URLs is checked
    Then a reputation check is performed for the unique URL "https://login-secure.example.net/verify"
    And the number of reputation checks is 1

  @AC3
  Scenario: Suspicious link badge is shown in the email view
    Given an email whose URL "https://login-secure.example.net/verify" is reported as suspicious by the reputation check
    When the email is opened in the email view
    Then the badge with test id "url-warning-badge" is present

  @AC3
  Scenario: No suspicious link badge for a legitimate URL
    Given an email whose URL "https://banque-officielle.example.com/" is reported as legitimate by the reputation check
    When the email is opened in the email view
    Then the badge with test id "url-warning-badge" is absent

  @AC3
  Scenario: The badge does not depend on the user setting
    Given the user setting for URL scanning is disabled
    And an email whose URL "https://login-secure.example.net/verify" is reported as suspicious by the reputation check
    When the email is opened in the email view
    Then the badge with test id "url-warning-badge" is present

  @AC4
  Scenario: Clicking a suspicious URL is intercepted and offers to proceed
    Given an email whose URL "https://login-secure.example.net/verify" is reported as suspicious by the reputation check
    When the email is opened in the email view
    And the user clicks the link "https://login-secure.example.net/verify"
    Then the click is intercepted inside the email view
    And a warning is shown offering "Proceed anyway"

  @AC5
  Scenario: The URL scan can be disabled by the user setting
    Given the user setting for URL scanning is disabled
    When an incoming email is received
    Then no URL of the email is scanned
    And no reputation check is performed

  @AC5
  Scenario: The URL scan is enabled by the user setting
    Given the user setting for URL scanning is enabled
    When an incoming email is received
    Then the URLs of the email are scanned
