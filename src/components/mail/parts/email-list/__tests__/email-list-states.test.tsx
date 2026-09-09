import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EmailListEmpty } from "@/components/mail/parts/email-list/email-list-states";

describe("EmailListEmpty", () => {
  it("renders the empty state with title and description", () => {
    render(<EmailListEmpty />);
    expect(screen.getByText("Aucun email ici")).toBeTruthy();
    expect(
      screen.getByText(
        "Ce dossier est vide, ou aucun email ne correspond à vos filtres actuels.",
      ),
    ).toBeTruthy();
  });

  it("displays keyboard shortcut hints", () => {
    render(<EmailListEmpty />);
    expect(screen.getByText("Composer")).toBeTruthy();
    expect(screen.getByText("Rechercher")).toBeTruthy();
    expect(screen.getByText("Naviguer")).toBeTruthy();
    expect(screen.getByText("Aide")).toBeTruthy();
  });

  it("shows keyboard shortcut keys", () => {
    render(<EmailListEmpty />);
    expect(screen.getByText("C")).toBeTruthy();
    expect(screen.getByText("/")).toBeTruthy();
    expect(screen.getByText("J/K")).toBeTruthy();
    expect(screen.getByText("Ctrl + /")).toBeTruthy();
  });
});
