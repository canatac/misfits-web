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

    render(<DeleteDraftButton />);
    const btn = screen.getByRole("button", { name: /supprimer le brouillon/i });
    expect(btn.textContent).toBe("Supprimer le brouillon");

    fireEvent.click(btn);
    expect(btn.textContent).toBe("Confirmer la suppression");
    expect(window.localStorage.getItem(STORAGE_KEY)).not.toBeNull();
    expect(useComposerStore.getState().subject).toBe("A draft");

    fireEvent.click(screen.getByRole("button", { name: /confirmer la suppression/i }));

    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(useComposerStore.getState().subject).toBe("");
    expect(useComposerStore.getState().body).toBe("");
  });

  it("keeps the draft when the confirmation is dismissed", () => {
    act(() => {
      const s = useComposerStore.getState();
      s.setSubject("A draft");
      s.saveDraft();
    });

    render(<DeleteDraftButton />);
    const btn = screen.getByRole("button", { name: /supprimer le brouillon/i });
    fireEvent.click(btn);
    fireEvent.blur(btn);

    expect(window.localStorage.getItem(STORAGE_KEY)).not.toBeNull();
    expect(useComposerStore.getState().subject).toBe("A draft");
  });
});
