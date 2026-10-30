import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ComposerDraftIndicator } from "../composer/composer-draft-indicator";

describe("ComposerDraftIndicator", () => {
  it("shows saved timestamp when not dirty", () => {
    render(<ComposerDraftIndicator lastSavedAt={new Date().toISOString()} isDirty={false} onDeleteDraft={() => {}} />);
    expect(screen.getByText(/Draft saved/i)).toBeTruthy();
  });

  it("shows unsaved changes when dirty", () => {
    render(<ComposerDraftIndicator lastSavedAt={new Date().toISOString()} isDirty={true} onDeleteDraft={() => {}} />);
    expect(screen.getByText(/Unsaved changes/i)).toBeTruthy();
  });

  it("renders delete button when draft exists", () => {
    render(<ComposerDraftIndicator lastSavedAt={new Date().toISOString()} isDirty={false} onDeleteDraft={() => {}} />);
    expect(screen.getByLabelText("Delete draft")).toBeTruthy();
  });

  it("calls onDeleteDraft when delete clicked", () => {
    const onDelete = vi.fn();
    render(<ComposerDraftIndicator lastSavedAt={new Date().toISOString()} isDirty={false} onDeleteDraft={onDelete} />);
    fireEvent.click(screen.getByLabelText("Delete draft"));
    expect(onDelete).toHaveBeenCalledOnce();
  });
});
