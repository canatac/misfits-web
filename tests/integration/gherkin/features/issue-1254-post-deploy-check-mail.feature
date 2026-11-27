Feature: Post-deploy mail check hydration and rendering
  As a user of misfits.ai Mail
  I want the /mail page to hydrate and render correctly
  So that the post-deploy check passes and the interface is stable

  @AC1
  Scenario: Fix hydration mismatch in /mail page
    Given the /mail page is loaded in a browser
    When the React hydration completes
    Then no Minified React error #418 occurs

  @AC2
  Scenario: Server and client render identical text content for /mail
    Given the /mail page is requested
    When the server renders the HTML
    And the client hydrates the same page
    Then the text content matches between server and client

  @AC3
  Scenario: No uncaught React errors in /mail during hydration
    Given the /mail page is loaded
    When React hydrates the page
    Then no uncaught React errors are thrown

  @AC4
  Scenario: Existing scenarios for issue-1254 pass
    Given the Gherkin feature file for issue-1254 exists
    When the scenarios are executed
    Then all scenarios pass