"use client";

import { DraftSavedIndicator } from "./DraftSavedIndicator";
import { DeleteDraftButton } from "./DeleteDraftButton";

/**
 * Composer footer bar: draft save indicator (AC3) + delete-draft button (AC4).
 * Purely presentational; both children read the composer store themselves.
 */
export function ComposerDraftBar() {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-2">
      <DraftSavedIndicator />
      <DeleteDraftButton />
    </div>
  );
}
