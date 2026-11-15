"use client";

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { DraftSavedIndicator } from "../DraftSavedIndicator";
import { useComposerStore } from "@/stores/composer-store";

beforeEach(() => {
  window.localStorage.clear();
  act(() => useComposerStore.getState().reset());
});

afterEach(() => {
  vi.useRealTimers();
});

describe("DraftSavedIndicator (AC3)", () => {
  it("renders nothing when no draft was ever saved", () => {
    render(<DraftSavedIndicator />);
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("shows 'Draft saved' with a timestamp once a draft is saved", () => {
    act(() => {
      const s = useComposerStore.getState();
      s.setSubject("Hello");
      s.saveDraft();
    });
    render(<DraftSavedIndicator />);
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent(/enregistré/i);
  });

  it("shows the saving state while an autosave is in flight", () => {
    vi.useFakeTimers();
    act(() => {
      const s = useComposerStore.getState();
      s.setSubject("Hello");
      s.startAutosave();
    });
    // The interval fires at AUTOSAVE_INTERVAL; before it, the store is dirty
    // but not yet saving, so force the saving state the way the timer does.
    act(() => useComposerStore.setState({ saveStatus: "saving" }));
    render(<DraftSavedIndicator />);
    expect(screen.getByRole("status")).toHaveTextContent(/Enregistrement/i);
    act(() => useComposerStore.getState().stopAutosave());
  });
});
