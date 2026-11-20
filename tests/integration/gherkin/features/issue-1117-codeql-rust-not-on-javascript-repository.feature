Feature: CodeQL Analyze (rust) must not run on the JavaScript repository
  As a developer of misfits-web
  I want the CodeQL workflow to analyze JavaScript/TypeScript only
  So that a Rust analysis cannot fail on a JavaScript codebase and mask a real regression

  Background:
    Given the misfits-web repository is a JavaScript/TypeScript codebase
    And the CodeQL workflow is triggered on a pull request of misfits-web

  @AC1
  Scenario: The CodeQL workflow analyzes JavaScript/TypeScript only
    When the CodeQL workflow runs on a pull request of misfits-web
    Then the analysis targets JavaScript/TypeScript only
    And no Rust analysis runs on this repository

  @AC2
  Scenario: The Analyze (rust) check no longer appears as a failure
    When the CodeQL workflow runs on a pull request of misfits-web
    Then the Analyze (rust) check no longer appears as a failure on pull requests of misfits-web

  @AC3
  Scenario: The workflow file is not changed in .github/ by the developer
    When the fix is applied
    Then the workflow file is not changed in .github/ by the developer
    And the fix is a configuration change approved by the operator
