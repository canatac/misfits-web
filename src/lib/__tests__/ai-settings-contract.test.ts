/**
 * AI Settings Contract Tests
 *
 * Cross-repo invariant: the frontend AI settings client must correctly
 * merge backend responses with defaults and handle the cache contract.
 * The backend (reimagined-guide) expects GET/PUT /api/settings/ai with
 * x-user-id and Authorization headers.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

const mockMailAuthHeaders = vi.fn();

vi.mock("@/lib/mail-api", () => ({
  mailAuthHeaders: () => mockMailAuthHeaders(),
}));

describe("ai-settings contract", () => {
  beforeEach(() => {
    mockMailAuthHeaders.mockReset();
    mockMailAuthHeaders.mockReturnValue({
      "Content-Type": "application/json",
      "x-user-id": "admin",
      Authorization: "Bearer token",
    });
  });

  it("exports fetchAiSettings, saveAiSettings, resolveFeatureModel", async () => {
    const { fetchAiSettings, saveAiSettings, resolveFeatureModel } =
      await import("@/lib/ai-settings");
    expect(typeof fetchAiSettings).toBe("function");
    expect(typeof saveAiSettings).toBe("function");
    expect(typeof resolveFeatureModel).toBe("function");
  });

  it("exports invalidateAiSettingsCache", async () => {
    const { invalidateAiSettingsCache } = await import("@/lib/ai-settings");
    expect(typeof invalidateAiSettingsCache).toBe("function");
  });

  it("fetchAiSettings calls /api/settings/ai with mailAuthHeaders", async () => {
    const { fetchAiSettings } = await import("@/lib/ai-settings");

    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          defaultModel: "meituan/longcat-2.0",
          features: { summarize: "qwen/qwen3.7-flash" },
          updatedAt: "2026-09-10T08:00:00Z",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    const result = await fetchAiSettings(true);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/settings/ai");
    expect(init.headers["x-user-id"]).toBe("admin");
    expect(init.headers.Authorization).toBe("Bearer token");
    expect(init.credentials).toBe("include");
    expect(result.defaultModel).toBe("meituan/longcat-2.0");

    vi.unstubAllGlobals();
  });

  it("fetchAiSettings returns default on network error", async () => {
    const { fetchAiSettings } = await import("@/lib/ai-settings");

    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockRejectedValueOnce(new Error("Network failed"));

    const result = await fetchAiSettings(true);

    // Should return default settings
    expect(result).toHaveProperty("defaultModel");
    expect(result).toHaveProperty("features");

    vi.unstubAllGlobals();
  });

  it("fetchAiSettings returns default on non-ok response", async () => {
    const { fetchAiSettings } = await import("@/lib/ai-settings");

    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 500 }));

    const result = await fetchAiSettings(true);

    expect(result).toHaveProperty("defaultModel");
    expect(result).toHaveProperty("features");

    vi.unstubAllGlobals();
  });

  it("saveAiSettings sends PUT with correct body", async () => {
    const { saveAiSettings } = await import("@/lib/ai-settings");

    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          defaultModel: "meituan/longcat-2.0",
          features: { summarize: "qwen/qwen3.7-flash" },
          updatedAt: "2026-09-10T09:00:00Z",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    const result = await saveAiSettings({
      defaultModel: "meituan/longcat-2.0",
      features: { summarize: "qwen/qwen3.7-flash" },
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/settings/ai");
    expect(init.method).toBe("PUT");
    expect(init.body).toContain("meituan/longcat-2.0");
    expect(result.defaultModel).toBe("meituan/longcat-2.0");

    vi.unstubAllGlobals();
  });

  it("saveAiSettings throws on non-ok response", async () => {
    const { saveAiSettings } = await import("@/lib/ai-settings");

    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockResolvedValueOnce(
      new Response("Internal error", { status: 500 })
    );

    await expect(
      saveAiSettings({ defaultModel: "test" })
    ).rejects.toThrow();

    vi.unstubAllGlobals();
  });

  it("resolveFeatureModel returns feature model when set", async () => {
    const { resolveFeatureModel } = await import("@/lib/ai-settings");

    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          defaultModel: "meituan/longcat-2.0",
          features: { summarize: "qwen/qwen3.7-flash" },
          updatedAt: "2026-09-10T08:00:00Z",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    const model = await resolveFeatureModel("summarize");
    expect(model).toBe("qwen/qwen3.7-flash");

    vi.unstubAllGlobals();
  });

  it("resolveFeatureModel falls back to default model", async () => {
    const { resolveFeatureModel } = await import("@/lib/ai-settings");

    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          defaultModel: "meituan/longcat-2.0",
          features: {},
          updatedAt: "2026-09-10T08:00:00Z",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    const model = await resolveFeatureModel("nonexistent");
    expect(model).toBe("meituan/longcat-2.0");

    vi.unstubAllGlobals();
  });
});
