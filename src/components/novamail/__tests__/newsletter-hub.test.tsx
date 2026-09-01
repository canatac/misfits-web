import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NewsletterHub } from "@/components/novamail/newsletter-hub";
import * as newsletterApi from "@/lib/newsletters-api";

vi.mock("@/lib/newsletters-api", () => ({
  listNewsletterSources: vi.fn(),
  listNewsletterItems: vi.fn(),
  createNewsletterSource: vi.fn(),
  createNewsletterItem: vi.fn(),
}));

describe("NewsletterHub server mode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
    vi.spyOn(newsletterApi, "createNewsletterSource").mockResolvedValue({
      id: "src-2",
      name: "Stratechery",
      url: "https://stratechery.com",
      createdAt: "2026-09-01T00:00:00Z",
      updatedAt: "2026-09-01T00:00:00Z",
    });
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
  });

  it("creates a source via server API", async () => {
    render(<NewsletterHub />);

    await waitFor(() => {
      expect(newsletterApi.listNewsletterSources).toHaveBeenCalled();
    });

    fireEvent.change(screen.getByLabelText("Nom de la source"), {
      target: { value: "Stratechery" },
    });
    fireEvent.change(screen.getByLabelText("URL de la source"), {
      target: { value: "stratechery.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Ajouter source/i }));

    await waitFor(() => {
      expect(newsletterApi.createNewsletterSource).toHaveBeenCalledWith({
        name: "Stratechery",
        url: "stratechery.com",
      });
    });
  });

  it("creates content via server API", async () => {
    render(<NewsletterHub />);

    await waitFor(() => {
      expect(newsletterApi.listNewsletterSources).toHaveBeenCalled();
    });

    fireEvent.change(screen.getByLabelText("Titre du contenu"), {
      target: { value: "OpenAI update" },
    });
    fireEvent.change(screen.getByLabelText("Résumé du contenu"), {
      target: { value: "Résumé test" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Ajouter contenu/i }));

    await waitFor(() => {
      expect(newsletterApi.createNewsletterItem).toHaveBeenCalledWith(
        expect.objectContaining({
          sourceId: "src-1",
          title: "OpenAI update",
          summary: "Résumé test",
          topic: "Tech",
        })
      );
    });
  });
});
