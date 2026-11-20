import { beforeEach, describe, expect, it } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { DraftAutosaveProvider } from "@/components/composer/DraftAutosaveProvider";
import { useComposerStore } from "@/stores/composer-store";
import { STORAGE_KEY } from "@/stores/composer-store-helpers";

const persistedDraft = {
  id: "draft-from-localstorage",
  to: [{ id: "r-1", email: "restored@example.com", type: "to" as const }],
  cc: [],
  bcc: [],
  subject: "Restored subject",
  body: "<p>Restored body</p>",
  attachments: [
    {
      id: "att-1",
      filename: "restored.png",
      contentType: "image/png",
      size: 10,
      progress: 100,
      status: "done" as const,
    },
  ],
  signature: { id: "sig-1", name: "Default", html: "<p>sig</p>" },
  updatedAt: new Date().toISOString(),
};

describe("DraftAutosaveProvider (AC2)", () => {
  beforeEach(() => {
    window.localStorage.clear();
    useComposerStore.getState().stopAutosave();
    useComposerStore.getState().reset();
  });

  it("restores the persisted draft into the store on mount, without the test writing the store", async () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(persistedDraft));

    // The composer store is empty before the provider mounts.
    expect(useComposerStore.getState().subject).toBe("");
    expect(useComposerStore.getState().body).toBe("");
    expect(useComposerStore.getState().attachments).toHaveLength(0);

    render(<DraftAutosaveProvider />);

    // The only writer is loadPersistedDraft(), called by the provider itself.
    await waitFor(() => {
      expect(useComposerStore.getState().subject).toBe("Restored subject");
    });

    const state = useComposerStore.getState();
    expect(state.body).toBe("<p>Restored body</p>");
    expect(state.attachments.map((a) => a.filename)).toEqual(["restored.png"]);
    expect(state.to.map((r) => r.email)).toEqual(["restored@example.com"]);
    expect(state.signature?.html).toBe("<p>sig</p>");
    expect(state.lastSavedAt).toBe(persistedDraft.updatedAt);
    expect(state.isDirty).toBe(false);

    useComposerStore.getState().stopAutosave();
  });

  it("starts with an empty composer when there is no persisted draft", async () => {
    render(<DraftAutosaveProvider />);

    await waitFor(() => {
      expect(useComposerStore.getState()._autosaveTimer).not.toBeNull();
    });

    const state = useComposerStore.getState();
    expect(state.subject).toBe("");
    expect(state.body).toBe("");
    expect(state.attachments).toHaveLength(0);
    expect(state.lastSavedAt).toBeNull();

    useComposerStore.getState().stopAutosave();
  });
});
