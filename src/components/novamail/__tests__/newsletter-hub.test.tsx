import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NewsletterHub } from "@/components/novamail/newsletter-hub";

const mem = new Map<string, string>();
const localStorageMock = {
  getItem: (k: string) => mem.get(k) ?? null,
  setItem: (k: string, v: string) => {
    mem.set(k, String(v));
  },
  removeItem: (k: string) => {
    mem.delete(k);
  },
  clear: () => mem.clear(),
  key: (i: number) => Array.from(mem.keys())[i] ?? null,
  get length() {
    return mem.size;
  },
};

Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
  configurable: true,
});

describe("NewsletterHub", () => {
  beforeEach(() => {
    mem.clear();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ content: "Digest test" }),
      } as Response)
    );
  });

  it("allows adding a source", () => {
    render(<NewsletterHub />);

    fireEvent.change(screen.getByLabelText("Nom de la source"), {
      target: { value: "TechCrunch Daily" },
    });
    fireEvent.change(screen.getByLabelText("URL de la source"), {
      target: { value: "techcrunch.com/newsletters" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Ajouter source/i }));

    expect(screen.getByText(/Source ajoutée: TechCrunch Daily/i)).toBeTruthy();
    expect(screen.getByText(/Sources actives: 3/i)).toBeTruthy();
  });

  it("allows adding content and keeps it after remount", () => {
    const { unmount } = render(<NewsletterHub />);

    fireEvent.change(screen.getByLabelText("Titre du contenu"), {
      target: { value: "OpenAI lance un nouveau modèle" },
    });
    fireEvent.change(screen.getByLabelText("Résumé du contenu"), {
      target: { value: "Résumé court de l'actualité IA de la journée." },
    });
    fireEvent.click(screen.getByRole("button", { name: /Ajouter contenu/i }));

    expect(screen.getByText(/Contenu ajouté: OpenAI lance un nouveau modèle/i)).toBeTruthy();
    expect(screen.getByText("OpenAI lance un nouveau modèle")).toBeTruthy();

    unmount();
    render(<NewsletterHub />);

    expect(screen.getByText("OpenAI lance un nouveau modèle")).toBeTruthy();
  });
});
