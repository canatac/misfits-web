/**
 * Integration test: Newsletters API cross-repo contract.
 *
 * Cross-repo contract: newsletters-api.ts wraps apiClient to call backend
 * newsletter management endpoints.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const fetchMock = vi.fn();
global.fetch = fetchMock;

vi.mock("@/lib/session", () => ({
  getAccessToken: vi.fn().mockReturnValue("test-token"),
  loadSession: vi.fn().mockReturnValue({ user: { email: "test@misfits.fr" } }),
  storeSession: vi.fn(),
  clearSession: vi.fn(),
}));

vi.mock("@/lib/session-payload", () => ({
  parseSession: (data: unknown) => data,
}));

describe("Newsletters API contract", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ sources: [] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    );
  });

  it("listNewsletterSources GETs /newsletters/sources", async () => {
    const { listNewsletterSources } = await import("@/lib/newsletters-api");
    await listNewsletterSources();

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/newsletters/sources"),
      expect.any(Object)
    );
  });

  it("createNewsletterSource POSTs to /newsletters/sources", async () => {
    const { createNewsletterSource } = await import("@/lib/newsletters-api");
    await createNewsletterSource({ name: "Test", url: "https://test.com" });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/newsletters/sources"),
      expect.objectContaining({ method: "POST" })
    );
  });

  it("updateNewsletterSource PATCHes /newsletters/sources/{id}", async () => {
    const { updateNewsletterSource } = await import("@/lib/newsletters-api");
    await updateNewsletterSource("src-1", { name: "Updated" });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/newsletters/sources/src-1"),
      expect.objectContaining({ method: "PATCH" })
    );
  });

  it("deleteNewsletterSource DELETEs /newsletters/sources/{id}", async () => {
    const { deleteNewsletterSource } = await import("@/lib/newsletters-api");
    await deleteNewsletterSource("src-2");

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/newsletters/sources/src-2"),
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it("listNewsletterItems GETs /newsletters/items", async () => {
    const { listNewsletterItems } = await import("@/lib/newsletters-api");
    await listNewsletterItems();

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/newsletters/items"),
      expect.any(Object)
    );
  });

  it("createNewsletterItem POSTs to /newsletters/items", async () => {
    const { createNewsletterItem } = await import("@/lib/newsletters-api");
    await createNewsletterItem({ sourceId: "src-1", title: "Test", summary: "Summary" });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/newsletters/items"),
      expect.objectContaining({ method: "POST" })
    );
  });

  it("summarizeNewsletterSource POSTs to /newsletters/sources/{id}/summarize", async () => {
    const { summarizeNewsletterSource } = await import("@/lib/newsletters-api");
    await summarizeNewsletterSource("src-3");

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/newsletters/sources/src-3/summarize"),
      expect.objectContaining({ method: "POST" })
    );
  });
});
