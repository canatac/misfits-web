import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { DeleteDraftButton } from "@/components/composer/DeleteDraftButton";
import { DraftSavedIndicator } from "@/components/composer/DraftSavedIndicator";
import { useComposerStore } from "@/stores/composer-store";
import { clearPersistedSnapshot } from "@/stores/composer-store-helpers";

describe("DraftSavedIndicator (AC3)", () => {
  beforeEach(() => {
    clearPersistedSnapshot();
    useComposerStore.getState().stopAutosave();
    useComposerStore.getState().reset();
  });

  it("renders nothing when no draft was saved", () => {
    const { container } = render(<DraftSavedIndicator />);
    expect(container.childElementCount).toBe(0);
  });

  it("shows \"Brouillon enregistré\" with a relative timestamp once saved", () => {
    useComposerStore.getState().setSubject("x");
    useComposerStore.getState().saveDraft();

    render(<DraftSavedIndicator />);
    const el = screen.getByTestId("draft-saved-indicator");
    expect(el.textContent).toContain("Brouillon enregistré");
    expect(el.textContent).toContain("à l'instant");
    expect(el.getAttribute("aria-live")).toBe("polite");
  });
});

describe("DeleteDraftButton (AC4)", () => {
  beforeEach(() => {
    clearPersistedSnapshot();
    useComposerStore.getState().stopAutosave();
    useComposerStore.getState().reset();
  });

  it("deletes the draft on the second click and resets the store", () => {
    const s = useComposerStore.getState();
    s.setSubject("draft to delete");
    s.saveDraft();
    expect(useComposerStore.getState().subject).toBe("draft to delete");

    render(<DeleteDraftButton />);
    const btn = screen.getByTestId("delete-draft-button");
    expect(btn.textContent).toBe("Supprimer le brouillon");

    fireEvent.click(btn);
    expect(btn.textContent).toBe("Confirmer la suppression");
    expect(useComposerStore.getState().subject).toBe("draft to delete");

    fireEvent.click(btn);
    expect(useComposerStore.getState().subject).toBe("");
    expect(useComposerStore.getState().lastSavedAt).toBeNull();
  });
});
