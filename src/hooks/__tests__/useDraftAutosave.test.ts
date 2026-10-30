import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDraftAutosave } from "../useDraftAutosave";

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
});

describe("useDraftAutosave", () => {
  it("saves draft to localStorage on interval", () => {
    const { result } = renderHook(() => useDraftAutosave());
    act(() => result.current.startAutosave());
    act(() => vi.advanceTimersByTime(11_000));
    expect(localStorage.getItem("composer.draft")).toBeTruthy();
  });

  it("loads draft from localStorage", () => {
    localStorage.setItem("composer.draft", JSON.stringify({ subject: "Test" }));
    const { result } = renderHook(() => useDraftAutosave());
    const draft = result.current.loadDraft();
    expect(draft?.subject).toBe("Test");
  });

  it("clears draft from localStorage", () => {
    localStorage.setItem("composer.draft", JSON.stringify({ subject: "Test" }));
    const { result } = renderHook(() => useDraftAutosave());
    act(() => result.current.clearDraft());
    expect(localStorage.getItem("composer.draft")).toBeNull();
  });
});
