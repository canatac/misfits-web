"use client";

import { useEffect, useCallback } from "react";
import { create } from "zustand";

interface CommandPaletteStore {
  open: boolean;
  openPalette: () => void;
  closePalette: () => void;
  togglePalette: () => void;
}

export const useCommandPaletteStore = create<CommandPaletteStore>((set) => ({
  open: false,
  openPalette: () => set({ open: true }),
  closePalette: () => set({ open: false }),
  togglePalette: () => set((s) => ({ open: !s.open })),
}));

export function useCommandPaletteKeyboard() {
  const togglePalette = useCommandPaletteStore((s) => s.togglePalette);
  const closePalette = useCommandPaletteStore((s) => s.closePalette);
  const open = useCommandPaletteStore((s) => s.open);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        togglePalette();
      }
      if (e.key === "Escape" && open) {
        closePalette();
      }
    },
    [togglePalette, closePalette, open],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
