/**
 * Integration test: AI settings cross-repo contract.
 *
 * ai-settings.ts fetches/saves settings via /api/settings/ai.
 * This test verifies the contract between frontend settings client
 * and backend expectations.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AiSettings } from "@/types/ai-settings";

const fetchMock = vi.fn();
global.fetch = fetchMock;

vi.mock("@/lib/session", () => ({
  getAccessToken: vi.fn().mockReturnValue("settings-token"),
  loadSession: vi.fn().mockReturnValue({
    user: { email: "settings@misfits.fr" },
  }),
  storeSession: vi.fn(),
  clearSession: vi.fn(),
}));

describe("AI settings cross-repo contract", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({
        defaultModel: "qwen/qwen3.7-flash",
        features: {
          compose: "qwen/qwen3.7-flash",
          translate: "qwen/qwen3.7-flash",
          triage: "qwen/qwen3.7-flash",
          security: "qwen/qwen3.7-flash",
          rewrite: "qwen/qwen3.7-flash",
          subject: "qwen/qwen3.7-flash",
          complete: "qwen/qwen3.7-flash",
        },
        updatedAt: "2026-01-01T00:00:00Z",
      }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    );
  });

  it("fetchAiSettings calls /api/settings/ai with GET", async () => {
    const { fetchAiSettings } = await import("@/lib/ai-settings");
    await fetchAiSettings(true);

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/settings/ai",
      expect.objectContaining({ cache: "no-store" })
    );
  });

  it("saveAiSettings sends PUT with defaultModel and features", async () => {
    const { saveAiSettings } = await import("@/lib/ai-settings");
    await saveAiSettings({ defaultModel: "gpt-4" });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/settings/ai",
      expect.objectContaining({
        method: "PUT",
        body: expect.stringContaining("gpt-4"),
      })
    );
  });

  it("AiSettings has defaultModel and features fields", () => {
    const settings: AiSettings = {
      defaultModel: "qwen/qwen3.7-flash",
      features: { compose: "qwen/qwen3.7-flash" },
      updatedAt: null,
    };
    expect(settings.defaultModel).toBeTruthy();
    expect(settings.features).toBeDefined();
  });

  it("AI_FEATURE_KEYS covers all feature types", async () => {
    const { AI_FEATURE_KEYS } = await import("@/types/ai-settings");
    expect(AI_FEATURE_KEYS).toContain("compose");
    expect(AI_FEATURE_KEYS).toContain("triage");
    expect(AI_FEATURE_KEYS).toContain("security");
    expect(AI_FEATURE_KEYS).toHaveLength(7);
  });

  it("defaultAiSettings returns all features with default model", async () => {
    const { defaultAiSettings } = await import("@/types/ai-settings");
    const defaults = defaultAiSettings();
    expect(defaults.defaultModel).toBeTruthy();
    expect(Object.keys(defaults.features)).toHaveLength(7);
  });

  it("settings use mailAuthHeaders for authentication", async () => {
    const { fetchAiSettings } = await import("@/lib/ai-settings");
    await fetchAiSettings(true);

    const call = fetchMock.mock.calls[0];
    const init = call[1] as RequestInit;
    const headers = new Headers(init.headers);
    expect(headers.get("authorization")).toBe("Bearer settings-token");
  });

  it("settings response includes updatedAt timestamp", async () => {
    const { fetchAiSettings } = await import("@/lib/ai-settings");
    const settings = await fetchAiSettings(true);
    expect(settings.updatedAt).toBeTruthy();
  });
});
