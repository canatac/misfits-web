import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { useComposerStore } from "@/stores/composer-store";
import {
  STORAGE_KEY,
  AUTOSAVE_INTERVAL,
  readPersistedSnapshot,
  clearPersistedSnapshot,
} from "@/stores/composer-store-helpers";

const attachment = {
  id: "att-1",
  filename: "file.txt",
  contentType: "text/plain",
  size: 3,
  progress: 100,
  status: "done" as const,
};

beforeEach(() => {
  window.localStorage.clear();
  clearPersistedSnapshot();
  useComposerStore.getState().stopAutosave();
  useComposerStore.setState({
    ...useComposerStore.getState(),
    to: [],
    cc: [],
    bcc: [],
    subject: "",
    body: "",
    attachments: [],
    signature: null,
    isDirty: false,
    saveStatus: "idle",
    lastSavedAt: null,
    _autosaveTimer: null,
    draftId: "draft-test",
  });
});

afterEach(() => {
  vi.useRealTimers();
  useComposerStore.getState().stopAutosave();
});

describe("composer draft autosave (AC1, AC2)", () => {
  it("persists the full snapshot (recipients, subject, body, attachments, signature) on saveDraft", () => {
    const s = useComposerStore.getState();
    s.setRecipients("to", [{ id: "r1", email: "a@b.c", type: "to" }]);
    s.setSubject("Subject");
    s.setBody("<p>Body</p>");
    s.addAttachment(attachment);
    s.setSignature({ id: "sig-1", name: "Sig", html: "<p>Sig</p>" });
    s.saveDraft();

    const snap = readPersistedSnapshot();
    expect(snap).not.toBeNull();
    expect(snap!.subject).toBe("Subject");
    expect(snap!.body).toBe("<p>Body</p>");
    expect(snap!.to).toHaveLength(1);
    expect(snap!.attachments).toHaveLength(1);
    expect(snap!.signature?.id).toBe("sig-1");
    expect(useComposerStore.getState().isDirty).toBe(false);
    expect(useComposerStore.getState().saveStatus).toBe("saved");
  });

  it("auto-saves every AUTOSAVE_INTERVAL ms while dirty (AC1)", () => {
    vi.useFakeTimers();
    const s = useComposerStore.getState();
    s.setSubject("Auto");
    s.startAutosave();

    expect(readPersistedSnapshot()).toBeNull();
    act_vi(() => vi.advanceTimersByTime(AUTOSAVE_INTERVAL));

    const snap = readPersistedSnapshot();
    expect(snap).not.toBeNull();
    expect(snap!.subject).toBe("Auto");
    expect(useComposerStore.getState().isDirty).toBe(false);
  });

  it("restores the draft into the store on reopen, body and attachments included (AC2)", () => {
    const s = useComposerStore.getState();
    s.setSubject("Persisted");
    s.setBody("<p>Persisted body</p>");
    s.addAttachment(attachment);
    s.saveDraft();

    // Simulate a fresh composer: reset then restore from persistence only.
    useComposerStore.getState().reset();
    const restored = useComposerStore.getState().loadPersistedDraft();

    expect(restored).toBe(true);
    const state = useComposerStore.getState();
    expect(state.subject).toBe("Persisted");
    expect(state.body).toBe("<p>Persisted body</p>");
    expect(state.attachments).toHaveLength(1);
    expect(state.isDirty).toBe(false);
  });
});

/** Local helper so the test file does not import react's act. */
function act_vi(fn: () => void) {
  fn();
}
