/**
 * Regression: selecting s.getLabelTree() inside a Zustand selector allocates a
 * new array on every read. With useSyncExternalStore that looks like a changed
 * snapshot every render → React error #185 (Maximum update depth exceeded)
 * on /mail (MailSidebar mounts on every authenticated visit).
 */
import { describe, it, expect, beforeEach } from "vitest";
import { useLabelStore } from "@/stores/label-store";

describe("label-store getLabelTree selector stability", () => {
  beforeEach(() => {
    // Reset to seed labels (partialize persists — clear for isolation)
    useLabelStore.setState({
      labels: useLabelStore.getState().labels.slice(),
      assignments: {},
    });
  });

  it("returns a new array reference on consecutive getLabelTree() calls", () => {
    const a = useLabelStore.getState().getLabelTree();
    const b = useLabelStore.getState().getLabelTree();
    // Documents the pitfall: callers MUST memoize / not use as selector result.
    expect(a).not.toBe(b);
    expect(a).toEqual(b);
  });

  it("keeps labels reference stable when state is untouched", () => {
    const a = useLabelStore.getState().labels;
    const b = useLabelStore.getState().labels;
    expect(a).toBe(b);
  });

  it("changes labels reference only when labels mutate", () => {
    const before = useLabelStore.getState().labels;
    useLabelStore
      .getState()
      .createLabel({ name: "Temp regression", color: "#000" });
    const after = useLabelStore.getState().labels;
    expect(after).not.toBe(before);
    expect(after.length).toBe(before.length + 1);
  });
});

describe("email-store setAccountId noop", () => {
  it("does not replace selectedEmailIds set when accountId is unchanged", async () => {
    const { useEmailStore } = await import("@/stores/email-store");
    useEmailStore.setState({
      accountId: "acc-1",
      selectedEmailId: "e1",
      selectedEmailIds: new Set(["e1"]),
    });
    const beforeIds = useEmailStore.getState().selectedEmailIds;
    useEmailStore.getState().setAccountId("acc-1");
    expect(useEmailStore.getState().selectedEmailIds).toBe(beforeIds);
    expect(useEmailStore.getState().selectedEmailId).toBe("e1");
  });

  it("updates when accountId changes", async () => {
    const { useEmailStore } = await import("@/stores/email-store");
    useEmailStore.setState({
      accountId: "acc-1",
      selectedEmailId: "e1",
      selectedEmailIds: new Set(["e1"]),
    });
    useEmailStore.getState().setAccountId("acc-2");
    expect(useEmailStore.getState().accountId).toBe("acc-2");
    expect(useEmailStore.getState().selectedEmailId).toBeNull();
    expect(useEmailStore.getState().selectedEmailIds.size).toBe(0);
  });
});
