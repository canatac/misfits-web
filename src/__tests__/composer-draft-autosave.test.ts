import { beforeEach, describe, expect, it, vi } from "vitest";
import { useComposerStore } from "@/stores/composer-store";
import {
  clearPersistedSnapshot,
  readPersistedSnapshot,
  STORAGE_KEY,
} from "@/stores/composer-store-helpers";

function recipient(email: string) {
  return { id: `r-${email}`, email, type: "to" as const };
}

describe("composer draft autosave (AC1, AC2, AC4)", () => {
  beforeEach(() => {
    window.localStorage.clear();
    useComposerStore.getState().stopAutosave();
    useComposerStore.getState().reset();
  });

  it("persists the full snapshot on saveDraft (recipients, subject, body, attachments, signature)", () => {
    const s = useComposerStore.getState();
    s.setRecipients("to", [recipient("a@example.com")]);
    s.setSubject("Hello");
    s.setBody("<p>Body</p>");
    s.addAttachment({
      id: "att-1",
      filename: "file.txt",
      contentType: "text/plain",
      size: 3,
      progress: 100,
      status: "done",
    });
    s.setSignature({ id: "sig-1", name: "Default", html: "<p>sig</p>" });

    useComposerStore.getState().saveDraft();

    const snap = readPersistedSnapshot();
    expect(snap).not.toBeNull();
    expect(snap!.to).toHaveLength(1);
    expect(snap!.subject).toBe("Hello");
    expect(snap!.body).toBe("<p>Body</p>");
    expect(snap!.attachments.map((a) => a.filename)).toEqual(["file.txt"]);
    expect(snap!.signature?.html).toBe("<p>sig</p>");
    expect(useComposerStore.getState().lastSavedAt).toBe(snap!.updatedAt);
    expect(useComposerStore.getState().isDirty).toBe(false);
    expect(useComposerStore.getState().saveStatus).toBe("saved");
  });

  it("restores the draft from localStorage without the test writing the store (AC2)", () => {
    const s = useComposerStore.getState();
    s.setRecipients("to", [recipient("restored@example.com")]);
    s.setSubject("Restored subject");
    s.setBody("<p>Restored body</p>");
    s.addAttachment({
      id: "att-2",
      filename: "restored.png",
      contentType: "image/png",
      size: 10,
      progress: 100,
      status: "done",
    });
    useComposerStore.getState().saveDraft();

    // Simulate a fresh mount: new store state, same localStorage.
    useComposerStore.getState().reset();
    expect(useComposerStore.getState().body).toBe("");

    const restored = useComposerStore.getState().loadPersistedDraft();

    expect(restored).toBe(true);
    const after = useComposerStore.getState();
    expect(after.subject).toBe("Restored subject");
    expect(after.body).toBe("<p>Restored body</p>");
    expect(after.attachments.map((a) => a.filename)).toEqual(["restored.png"]);
    expect(after.to.map((r) => r.email)).toEqual(["restored@example.com"]);
    expect(after.lastSavedAt).toBe(readPersistedSnapshot()!.updatedAt);
  });

  it("autosaves every 10s while dirty (AC1)", () => {
    vi.useFakeTimers();
    try {
      const s = useComposerStore.getState();
      s.startAutosave();
      s.setSubject("dirty");

      expect(readPersistedSnapshot()).toBeNull();
      vi.advanceTimersByTime(10_000);

      expect(readPersistedSnapshot()!.subject).toBe("dirty");
      expect(useComposerStore.getState().saveStatus).toBe("saved");
    } finally {
      useComposerStore.getState().stopAutosave();
      vi.useRealTimers();
    }
  });

  it("does not autosave when the draft is clean", () => {
    vi.useFakeTimers();
    try {
      const s = useComposerStore.getState();
      s.startAutosave();
      vi.advanceTimersByTime(30_000);
      expect(readPersistedSnapshot()).toBeNull();
    } finally {
      useComposerStore.getState().stopAutosave();
      vi.useRealTimers();
    }
  });

  it("clears the persisted draft and resets the store (AC4)", () => {
    const s = useComposerStore.getState();
    s.setSubject("to delete");
    s.saveDraft();
    expect(readPersistedSnapshot()).not.toBeNull();

    useComposerStore.getState().stopAutosave();
    useComposerStore.getState().reset();
    clearPersistedSnapshot();

    expect(readPersistedSnapshot()).toBeNull();
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(useComposerStore.getState().subject).toBe("");
    expect(useComposerStore.getState().lastSavedAt).toBeNull();
  });
});
