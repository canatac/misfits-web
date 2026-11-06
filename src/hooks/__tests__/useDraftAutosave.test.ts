import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDraftAutosave } from "../useDraftAutosave";
import { useComposerStore } from "@/stores/composer-store";

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useDraftAutosave", () => {
  it("saves draft to localStorage on interval when dirty", () => {
    act(() => {
      const store = useComposerStore.getState();
      store.setSubject("Hello");
      store.setBody("Body");
    });
    const { result } = renderHook(() => useDraftAutosave());
    act(() => result.current.startAutosave());
    act(() => vi.advanceTimersByTime(11_000));
    expect(localStorage.getItem("composer.draft")).toBeTruthy();
  });

  it("does not save when the composer is not dirty", () => {
    act(() => {
      const store = useComposerStore.getState();
      store.setSubject("");
      store.setBody("");
    });
    act(() => {
      useComposerStore.setState({ isDirty: false });
    });
    const { result } = renderHook(() => useDraftAutosave());
    act(() => result.current.startAutosave());
    act(() => vi.advanceTimersByTime(11_000));
    expect(localStorage.getItem("composer.draft")).toBeNull();
  });

  it("loads draft from localStorage", () => {
    localStorage.setItem("composer.draft", JSON.stringify({ subject: "Test" }));
    const { result } = renderHook(() => useDraftAutosave());
    const draft = result.current.loadDraft();
    expect(draft?.subject).toBe("Test");
  });

  it("restores the draft into the composer store", () => {
    localStorage.setItem(
      "composer.draft",
      JSON.stringify({ subject: "Restored", body: "Body text" }),
    );
    const { result } = renderHook(() => useDraftAutosave());
    let restored: { subject?: string; body?: string } | null = null;
    act(() => {
      restored = result.current.loadDraft();
      if (restored) {
        const store = useComposerStore.getState();
        store.setSubject(restored.subject ?? "");
        store.setBody(restored.body ?? "");
        useComposerStore.setState({ isDirty: false });
      }
    });
    expect(useComposerStore.getState().subject).toBe("Restored");
    expect(useComposerStore.getState().body).toBe("Body text");
  });

  it("clears draft from localStorage", () => {
    localStorage.setItem("composer.draft", JSON.stringify({ subject: "Test" }));
    const { result } = renderHook(() => useDraftAutosave());
    act(() => result.current.clearDraft());
    expect(localStorage.getItem("composer.draft")).toBeNull();
  });

  it("debounces a save after an edit", () => {
    act(() => {
      const store = useComposerStore.getState();
      store.setSubject("Typed");
      store.setBody("Typed body");
    });
    const { result } = renderHook(() => useDraftAutosave());
    act(() => result.current.scheduleDebouncedSave());
    expect(localStorage.getItem("composer.draft")).toBeNull();
    act(() => vi.advanceTimersByTime(10_000));
    expect(localStorage.getItem("composer.draft")).toBeTruthy();
  });
});
