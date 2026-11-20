Feature: Command palette announces search results and its empty state
  The palette (src/components/command-palette.tsx) runs searchEmails on every
  keystroke and renders its result inline. A screen reader user gets no
  announcement: the number of matching emails is never announced, and the
  empty message "Aucun email trouvé pour cette recherche." is rendered inline
  without a live region.

  @AC1
  Scenario: The number of search results is announced through a live region when it changes
    Given the command palette is open
    And the user has typed a query of at least the search threshold
    When the search results change
    Then the number of search results is announced to assistive technology through a live region

  @AC2
  Scenario: The empty-result message is announced through the same live region
    Given the command palette is open
    And the user has typed a query of at least the search threshold
    When the search returns no email
    Then the empty-result message "Aucun email trouvé pour cette recherche." is announced through the same live region

  @AC3
  Scenario: A query shorter than the search threshold shows a distinct announced hint
    Given the command palette is open
    When the user types a query shorter than the search threshold
    Then a distinct hint is shown
    And the hint is announced to assistive technology
    And the generic no-result message is not shown

  @AC4
  Scenario: Each criterion has a test
    Given the scenarios of this feature
    Then each acceptance criterion of issue #1146 has a scenario tagged with its number
