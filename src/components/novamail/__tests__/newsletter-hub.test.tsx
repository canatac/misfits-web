import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NewsletterHub } from "@/components/novamail/newsletter-hub";
import * as newsletterApi from "@/lib/newsletters-api";

vi.mock("@/lib/newsletters-api", () => ({
  listNewsletterSources: vi.fn(),
  listNewsletterItems: vi.fn(),
  createNewsletterSource: vi.fn(),
  updateNewsletterSource: vi.fn(),
  deleteNewsletterSource: vi.fn(),
  createNewsletterItem: vi.fn(),
  summarizeNewsletterSource: vi.fn(),
  listNewsletterSuggestions: vi.fn(),
  getNewsletterMonitoringActivity: vi.fn(),
  buildNewsletterMonitoringSnapshot: vi.fn(),
}));

describe("NewsletterHub server mode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, "confirm").mockReturnValue(true);

    vi.spyOn(newsletterApi, "listNewsletterSources").mockResolvedValue([
      {
        id: "src-1",
        name: "TechCrunch",
        url: "https://techcrunch.com",
        createdAt: "2026-09-01T00:00:00Z",
        updatedAt: "2026-09-01T00:00:00Z",
      },
    ]);
    vi.spyOn(newsletterApi, "listNewsletterItems").mockResolvedValue([]);
    vi.spyOn(newsletterApi, "listNewsletterSuggestions").mockResolvedValue({
      interests: ["tech", "ai"],
      suggestions: [
        {
          title: "Hacker News",
          url: "https://news.ycombinator.com/rss",
          kind: "rss",
          reason: "Veille tech généraliste.",
          matchedInterests: ["tech"],
          matchScore: 8,
        },
      ],
    });
    vi.spyOn(newsletterApi, "getNewsletterMonitoringActivity").mockResolvedValue({
      generatedAt: "2026-09-04T00:00:00Z",
      limit: 80,
      metrics: {
        totalRuns: 1,
        completedRuns: 1,
        failedRuns: 0,
        successRate: 100,
        avgLatencyMs: 1000,
        p95LatencyMs: 1000,
        promptTokens: 100,
        completionTokens: 20,
        totalTokens: 120,
        avgTokensPerRun: 120,
      },
      runs: [],
      byFeature: [],
    } as any);
    vi.spyOn(newsletterApi, "buildNewsletterMonitoringSnapshot").mockReturnValue({
      status: "idle",
      updatedAt: "2026-09-04T00:00:00Z",
      lastSummaryAt: "2026-09-04T00:00:00Z",
      activeSources: 1,
      totalSummaries: 0,
      summaries24h: 0,
      runCount: 1,
      runningCount: 0,
      failedCount: 0,
      successRate: 100,
      totalTokens: 120,
      totalCostUsd: 0,
    });
    vi.spyOn(newsletterApi, "createNewsletterSource").mockResolvedValue({
      id: "src-2",
      name: "Stratechery",
      url: "https://stratechery.com",
      createdAt: "2026-09-01T00:00:00Z",
      updatedAt: "2026-09-01T00:00:00Z",
    });
    vi.spyOn(newsletterApi, "updateNewsletterSource").mockResolvedValue({
      id: "src-1",
      name: "TechCrunch",
      url: "https://techcrunch.com/feed",
      createdAt: "2026-09-01T00:00:00Z",
      updatedAt: "2026-09-01T00:00:01Z",
    });
    vi.spyOn(newsletterApi, "deleteNewsletterSource").mockResolvedValue({ deleted: true });
    vi.spyOn(newsletterApi, "createNewsletterItem").mockResolvedValue({
      id: "it-1",
      sourceId: "src-1",
      title: "Titre",
      summary: "Résumé",
      topic: "Tech",
      signal: 88,
      links: [{ name: "TechCrunch", url: "https://techcrunch.com" }],
      createdAt: "2026-09-01T00:00:00Z",
      updatedAt: "2026-09-01T00:00:00Z",
    });
  });

  it("loads sources/items from server", async () => {
    render(<NewsletterHub />);

    await waitFor(() => {
      expect(newsletterApi.listNewsletterSources).toHaveBeenCalledTimes(1);
      expect(newsletterApi.listNewsletterItems).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByText(/Sources actives: 1/i)).toBeTruthy();
    expect(screen.getByText(/Mini cockpit newsletters/i)).toBeTruthy();
  });

  it("creates a source URL via server API", async () => {
    render(<NewsletterHub />);

    await waitFor(() => {
      expect(newsletterApi.listNewsletterSources).toHaveBeenCalled();
    });

    fireEvent.change(screen.getByLabelText("URL de la source"), {
      target: { value: "stratechery.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Ajouter URL/i }));

    await waitFor(() => {
      expect(newsletterApi.createNewsletterSource).toHaveBeenCalledWith({
        name: "stratechery.com",
        url: "https://stratechery.com",
      });
    });
  });

  it("updates an existing source URL", async () => {
    render(<NewsletterHub />);

    await waitFor(() => {
      expect(newsletterApi.listNewsletterSources).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByRole("button", { name: /Modifier/i }));
    fireEvent.change(screen.getByLabelText("URL source édition"), {
      target: { value: "https://techcrunch.com/feed" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Enregistrer/i }));

    await waitFor(() => {
      expect(newsletterApi.updateNewsletterSource).toHaveBeenCalledWith("src-1", {
        name: "TechCrunch",
        url: "https://techcrunch.com/feed",
      });
    });
  });

  it("deletes a source", async () => {
    render(<NewsletterHub />);

    await waitFor(() => {
      expect(newsletterApi.listNewsletterSources).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByRole("button", { name: /Supprimer/i }));

    await waitFor(() => {
      expect(newsletterApi.deleteNewsletterSource).toHaveBeenCalledWith("src-1");
    });
  });

  it("subscribes from suggested feeds", async () => {
    render(<NewsletterHub />);

    await waitFor(() => {
      expect(newsletterApi.listNewsletterSuggestions).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByRole("button", { name: /S'abonner/i }));

    await waitFor(() => {
      expect(newsletterApi.createNewsletterSource).toHaveBeenCalledWith({
        name: "Hacker News",
        url: "https://news.ycombinator.com/rss",
      });
    });
  });
});
