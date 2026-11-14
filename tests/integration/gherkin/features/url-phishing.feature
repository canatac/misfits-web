Feature: URL phishing detection (issue #1046)
  The email client extracts URLs from the body, checks their reputation,
  shows a warning badge in the email view, and warns before opening a
  suspicious link. The user can disable the scan in settings.

  Background:
    Given the source file "src/lib/url-scanner.ts" is loaded
    And the source file "src/hooks/useUrlScanSetting.ts" is loaded
    And the source file "src/components/mail/email-view.tsx" is loaded
    And the source file "src/components/mail/url-safe-link.tsx" is loaded
    And the source file "src/components/mail/__tests__/email-view-url-scan.test.tsx" is loaded

  Scenario: Email with a legitimate URL
    Given an email body with the URL "https://google.com/search"
    When the URLs are extracted and scanned
    Then no URL is suspicious
    And the warning badge is not shown in the email view

  Scenario: Email with a suspicious URL
    Given an email body with the URL "https://phishing.example/steal"
    When the URLs are extracted and scanned
    Then the URL is suspicious
    And the warning badge is shown in the email view

  Scenario: Email with a shortened URL
    Given an email body with the shortened URL "https://bit.ly/abc123"
    When the URLs are extracted and scanned
    Then the shortened URL is flagged as suspicious
    And the resolution of the shortened URL is requested

  Scenario: Click on a suspicious link in the email view
    Given an email body with the URL "https://phishing.example/steal"
    When the URLs are extracted and scanned
    Then the warning badge is shown in the email view
    And a click on a suspicious link in the email view is intercepted
    And the warning page offers to continue

  Scenario: User disables URL scanning
    Given the user setting "urlScanEnabled" is false
    When an email with a suspicious URL is opened
    Then no URL is scanned
    And the warning badge is not shown in the email view
