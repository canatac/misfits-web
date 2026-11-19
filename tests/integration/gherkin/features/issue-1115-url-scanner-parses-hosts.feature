Feature: URL scanner parses the host of a URL, never matches it as a substring
  A host name was matched as a substring of the raw URL, so arbitrary hosts around it passed the blocklist, the trusted list and the shortener list. The scanner must parse the hostname with the URL parser and compare that parsed value, and its Gherkin steps must assert real behaviour, not source text.

  Background:
    Given the URL scanner is configured with a blocklist, a trusted list and a shortener list

  @AC1
  Scenario: A blocklisted host is detected from its parsed hostname
    Given the blocklist contains the host "evil.example"
    When the scanner checks the URL "https://evil.example/login"
    Then the scanner reports the URL as blocked

  @AC1
  Scenario: A host that only contains a blocklisted name as a substring is not blocked
    Given the blocklist contains the host "evil.example"
    When the scanner checks the URL "https://notevil.example.attacker.test/login"
    Then the scanner does not report the URL as blocked

  @AC1
  Scenario: A trusted host is detected from its parsed hostname
    Given the trusted list contains the host "trusted.example"
    When the scanner checks the URL "https://trusted.example/inbox"
    Then the scanner reports the URL as trusted

  @AC1
  Scenario: A trusted host as a substring of another host is not trusted
    Given the trusted list contains the host "trusted.example"
    When the scanner checks the URL "https://trusted.example.attacker.test/inbox"
    Then the scanner does not report the URL as trusted

  @AC1
  Scenario: A shortener host is detected from its parsed hostname
    Given the shortener list contains the host "short.example"
    When the scanner checks the URL "https://short.example/abc123"
    Then the scanner reports the URL as a shortener link

  @AC1
  Scenario: A shortener host as a substring of another host is not reported
    Given the shortener list contains the host "short.example"
    When the scanner checks the URL "https://short.example.attacker.test/abc123"
    Then the scanner does not report the URL as a shortener link

  @AC2
  Scenario: A Gherkin step asserts the parsed hostname of the URL under test
    Given the blocklist contains the host "evil.example"
    When the scanner parses the URL "https://evil.example/login"
    Then the parsed hostname of the URL is "evil.example"

  @AC2
  Scenario: A Gherkin step asserts the rendered safety state of a scanned link
    Given the blocklist contains the host "evil.example"
    When the scanner checks the URL "https://evil.example/login"
    Then the rendered link shows the blocked state

  @AC3
  Scenario: The scanner reports no new CodeQL alert and a green test suite
    Given the changed files of the URL scanner are analyzed by CodeQL
    When the analysis completes
    Then CodeQL reports no new alert on the changed files
    And the test suite passes in CI
