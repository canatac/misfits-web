import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDraftAutosave } from "../useDraftAutosave";
import { useComposerStore } from "@/stores/composer-store";
import { STORAGE_KEY } from "@/stores/composer-store-helpers";

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
  act(() => {
    useComposerStore.getState().reset();
  });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useDraftAutosave", () => {
  it("saves the draft to localStorage on the autosave interval when dirty", () => {
    act(() => {
      const store = useComposerStore.getState();
      store.setSubject("Hello");
      store.setBody("<p>Body</p>");
    });
    const { result } = renderHook(() => useDraftAutosave());
    act(() => result.current.startAutosave());
    act(() => vi.advanceTimersByTime(11_000));
    const raw = localStorage.getItem(STORAGE_KEY);
    expect(raw).toBeTruthy();
    const snap = JSON.parse(raw as string);
    expect(snap.subject).toBe("Hello");
    expect(snap.body).toBe("<p>Body</p>");
  });

  it("does not save when the composer is not dirty", () => {
    const { result } = renderHook(() => useDraftAutosave());
    act(() => result.current.startAutosave());
    act(() => vi.advanceTimersByTime(11_000));
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("restores the persisted draft into the composer store", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        id: "draft-restored",
        to: [],
        cc: [],
        bcc: [],
        subject: "Restored",
        body: "<p>Body text</p>",
        attachments: [],
        signature: null,
        updatedAt: new Date().toISOString(),
      }),
    );
    const { result } = renderHook(() => useDraftAutosave());
    let restored = false;
    act(() => {
      restored = result.current.loadDraft();
    });
    expect(restored).toBe(true);
    expect(useComposerStore.getState().subject).toBe("Restored");
    expect(useComposerStore.getState().body).toBe("<p>Body text</p>");
    expect(useComposerStore.getState().lastSavedAt).toBeTruthy();
  });

  it("returns false when there is no persisted draft", () => {
    const { result } = renderHook(() => useDraftAutosave());
    let restored = true;
    act(() => {
      restored = result.current.loadDraft();
    });
    expect(restored).toBe(false);
  });

  it("clears the draft and resets the composer", () => {
    act(() => {
      const store = useComposerStore.getState();
      store.setSubject("Typed");
      store.saveDraft();
    });
    expect(localStorage.getItem(STORAGE_KEY)).toBeTruthy();
    const { result } = renderHook(() => useDraftAutosave());
    act(() => result.current.clearDraft());
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(useComposerStore.getState().subject).toBe("");
  });

  it("saves immediately through scheduleDebouncedSave", () => {
    act(() => {
      const store = useComposerStore.getState();
      store.setSubject("Typed");
      store.setBody("Typed body");
    });
    const { result } = renderHook(() => useDraftAutosave());
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    act(() => result.current.scheduleDebouncedSave());
    expect(localStorage.getItem(STORAGE_KEY)).toBeTruthy();
  });
});
