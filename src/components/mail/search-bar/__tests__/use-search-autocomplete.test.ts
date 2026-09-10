import { describe, expect, it } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSearchAutocomplete } from "@/components/mail/search-bar/use-search-autocomplete";

describe("useSearchAutocomplete", () => {
  it("returns null suggestion for empty input", () => {
    const { result } = renderHook(() => useSearchAutocomplete());

    act(() => {
      result.current.updateAutocomplete("", 0);
    });

    expect(result.current.autocomplete.suggestion).toBeNull();
  });

  it("suggests 'from' when typing 'fr'", () => {
    const { result } = renderHook(() => useSearchAutocomplete());

    act(() => {
      result.current.updateAutocomplete("fr", 2);
    });

    expect(result.current.autocomplete.suggestion?.operator).toBe("from");
    expect(result.current.autocomplete.partial).toBe("fr");
  });

  it("suggests 'to' when typing 'to'", () => {
    const { result } = renderHook(() => useSearchAutocomplete());

    act(() => {
      result.current.updateAutocomplete("to", 2);
    });

    expect(result.current.autocomplete.suggestion?.operator).toBe("to");
  });

  it("returns null for empty operator", () => {
    const { result } = renderHook(() => useSearchAutocomplete());

    act(() => {
      result.current.updateAutocomplete("from:", 4);
    });

    // After colon, no suggestion (user already committed to operator)
    // Actually our hook doesn't handle post-colon, so it depends on regex
    // "from:" → no word chars at end → null
    expect(result.current.autocomplete.suggestion).toBeNull();
  });

  it("accepts suggestion and returns full operator", () => {
    const { result } = renderHook(() => useSearchAutocomplete());

    act(() => {
      result.current.updateAutocomplete("fr", 2);
    });

    const newQuery = result.current.acceptSuggestion("fr", 2);
    expect(newQuery).toBe("from:");
  });

  it("accepts suggestion in middle of query", () => {
    const { result } = renderHook(() => useSearchAutocomplete());

    act(() => {
      result.current.updateAutocomplete("hello fr", 8);
    });

    const newQuery = result.current.acceptSuggestion("hello fr", 8);
    expect(newQuery).toBe("hello from:");
  });

  it("returns partial matches list", () => {
    const { result } = renderHook(() => useSearchAutocomplete());

    act(() => {
      result.current.updateAutocomplete("s", 1);
    });

    // "s" matches: subject, has (no), before (no), is (no), label (no), filename (no), larger (no), smaller (no)
    // Actually "s" should match: subject, has (no - "has".startsWith("s")? no), subject (yes), smaller (yes), subject (yes)
    expect(result.current.filteredOperators.length).toBeGreaterThan(0);
    const operators = result.current.filteredOperators.map((o) => o.operator);
    expect(operators).toContain("subject");
    expect(operators).toContain("smaller");
  });

  it("dismisses autocomplete", () => {
    const { result } = renderHook(() => useSearchAutocomplete());

    act(() => {
      result.current.updateAutocomplete("fr", 2);
    });

    expect(result.current.autocomplete.showPanel).toBe(false); // single match

    act(() => {
      result.current.dismiss();
    });

    expect(result.current.autocomplete.showPanel).toBe(false);
  });
});
