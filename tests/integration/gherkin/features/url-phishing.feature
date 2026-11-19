Feature: URL phishing detection (issue #1046)
  The email client extracts URLs from the body, checks their reputation,
  shows a warning badge in the email view, and warns before opening a
  suspicious link. The user can disable the scan in settings.

  Background:
    Given the email view test suite "src/components/mail/__tests__/email-view-url-scan.test.tsx" is loaded

  @AC1
  Scenario: URLs are extracted from the email body (HTML and text)
    Given an email body with the URL "https://google.com/search"
    When the URLs are extracted from the body
    Then the extracted URL host is "google.com"

  @AC2
  Scenario: Reputation is checked for each unique URL
    Given an email body with the URL "https://phishing.example/steal"
    When the URLs are extracted and scanned
    Then the reputation of the URL host "phishing.example" is checked

  @AC3
  Scenario: Badge "Lien suspect" visible in the email view, whatever the user setting
    Given an email body with the URL "https://phishing.example/steal"
    When the email view is rendered
    Then the badge "url-warning-badge" is present in the email view

  @AC3
  Scenario: No badge in the email view for a legitimate URL
    Given an email body with the URL "https://google.com/search"
    When the email view is rendered
    Then the badge "url-warning-badge" is absent from the email view

  @AC3
  Scenario: The badge stays visible when the user setting is disabled
    Given the user setting "urlScanEnabled" is false
    And an email body with the URL "https://phishing.example/steal"
    When the email view is rendered
    Then the badge "url-warning-badge" is present in the email view

  @AC4
  Scenario: Clic sur URL suspecte: the click is intercepted and the warning offers "Proceed anyway"
    Given an email body with the URL "https://phishing.example/steal"
    When a click on the suspicious link happens in the email view
    Then the navigation is prevented in the email view
    And the warning offers "Proceed anyway"

  @AC5
  Scenario: Paramètre utilisateur: when the setting is disabled no URL is scanned and the scan-dependent banner and safe-link list are hidden; the badge of AC3 stays visible
    Given the user setting "urlScanEnabled" is false
    And an email body with the URL "https://phishing.example/steal"
    When the email view is rendered
    Then the scan-dependent banner "url-phishing-banner" is hidden
    And the safe-link list "email-body-safe-links" is hidden
    And the badge "url-warning-badge" is present in the email view

  @AC6
  Scenario: Tests Gherkin: email with a legitimate URL
    Given an email body with the URL "https://google.com/search"
    When the URLs are extracted and scanned
    Then no URL is suspicious

  @AC6
  Scenario: Tests Gherkin: email with a suspicious URL
    Given an email body with the URL "https://phishing.example/steal"
    When the URLs are extracted and scanned
    Then the URL is suspicious

  @AC6
  Scenario: Tests Gherkin: email with a shortened URL
    Given an email body with the shortened URL "https://bit.ly/abc123"
    When the URLs are extracted and scanned
    Then the shortened URL is flagged as suspicious
    And the resolution of the shortened URL is requested

  @AC7
  Scenario: The Gherkin steps pass in CI and no host is matched as a substring of the raw URL
    Given the email view test suite "src/components/mail/__tests__/email-view-url-scan.test.tsx" is loaded
    When the email view test suite is executed
    Then the email view test suite passes
    And every compared host is parsed from the raw URL
