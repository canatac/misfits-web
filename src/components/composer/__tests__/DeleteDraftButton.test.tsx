"use client";

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { DeleteDraftButton } from "../DeleteDraftButton";
import { useComposerStore } from "@/stores/composer-store";
import { STORAGE_KEY } from "@/stores/composer-store-helpers";

beforeEach(() => {
  window.localStorage.clear();
  act(() => useComposerStore.getState().reset());
  vi.restoreAllMocks();
});

describe("DeleteDraftButton (AC4)", () => {
  it("clears the persisted draft and resets the composer on confirm", () => {
    act(() => {
      const s = useComposerStore.getState();
      s.setSubject("A draft");
      s.setBody("<p>body</p>");
      s.saveDraft();
    });
    expect(window.localStorage.getItem(STORAGE_KEY)).not.toBeNull();

    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<DeleteDraftButton />);
    fireEvent.click(screen.getByRole("button", { name: /supprimer le brouillon/i }));

    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(useComposerStore.getState().subject).toBe("");
    expect(useComposerStore.getState().body).toBe("");
  });

  it("keeps the draft when the user cancels", () => {
    act(() => {
      const s = useComposerStore.getState();
      s.setSubject("A draft");
      s.saveDraft();
    });
    vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<DeleteDraftButton />);
    fireEvent.click(screen.getByRole("button", { name: /supprimer le brouillon/i }));

    expect(window.localStorage.getItem(STORAGE_KEY)).not.toBeNull();
    expect(useComposerStore.getState().subject).toBe("A draft");
  });
});
