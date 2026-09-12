import { beforeEach, describe, expect, it } from "vitest";
import {
  isMuted,
  loadMuteRecords,
  muteThread,
  saveMuteRecords,
  toggleMute,
  unmuteThread,
} from "@/lib/mute-thread";

declare let localStorage: Storage;

describe("mute-thread", () => {
  beforeEach(() => localStorage.clear());

  it("mutes a thread permanently by default", () => {
    const r = muteThread("t1");
    expect(isMuted(r)).toBe(true);
    expect(r.expiresAt).toBeNull();
  });

  it("mutes a thread for a duration", () => {
    const r = muteThread("t1", { durationMs: 1000 });
    expect(isMuted(r)).toBe(true);
    expect(r.expiresAt).toBe(r.mutedAt + 1000);
  });

  it("isMuted returns false after expiry", () => {
    const r = muteThread("t1", { durationMs: 100 });
    expect(isMuted(r, r.mutedAt + 200)).toBe(false);
  });

  it("unmute sets expiresAt in the past", () => {
    const r = unmuteThread(muteThread("t1"));
    expect(isMuted(r)).toBe(false);
  });

  it("toggle adds then removes", () => {
    let recs = toggleMute("t1", []);
    expect(recs).toHaveLength(1);
    recs = toggleMute("t1", recs);
    expect(recs).toHaveLength(0);
  });

  it("save/load round-trip", () => {
    saveMuteRecords([muteThread("t1"), muteThread("t2")]);
    expect(loadMuteRecords()).toHaveLength(2);
  });
});
