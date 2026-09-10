import { describe, expect, it } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSearchAutocomplete } from "@/components/mail/search-bar/use-search-autocomplete";
import { OPERATOR_META } from "@/types/search";

describe("useSearchAutocomplete", () => {
  it("OPERATOR_META is populated", () => {
    expect(OPERATOR_META.length).toBeGreaterThan(0);
    expect(OPERATOR_META[0].operator).toBe("from");
  });

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

  it("shows suggestion for partial operator after space", () => {
    const { result } = renderHook(() => useSearchAutocomplete());

    act(() => {
      result.current.updateAutocomplete("hello fr", 8);
    });

    expect(result.current.autocomplete.suggestion?.operator).toBe("from");
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

    expect(result.current.autocomplete.showPanel).toBe(false);

    act(() => {
      result.current.dismiss();
    });

    expect(result.current.autocomplete.showPanel).toBe(false);
  });
});
