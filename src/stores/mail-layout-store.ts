"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface MailLayoutState {
  desktopSidebarOpen: boolean;
  desktopChatOpen: boolean;
  setDesktopSidebarOpen: (open: boolean) => void;
  toggleDesktopSidebar: () => void;
  setDesktopChatOpen: (open: boolean) => void;
  toggleDesktopChat: () => void;
}

export const useMailLayoutStore = create<MailLayoutState>()(
  persist(
    (set) => ({
      desktopSidebarOpen: true,
      desktopChatOpen: false,
      setDesktopSidebarOpen: (open) => set({ desktopSidebarOpen: open }),
      toggleDesktopSidebar: () =>
        set((s) => ({ desktopSidebarOpen: !s.desktopSidebarOpen })),
      setDesktopChatOpen: (open) => set({ desktopChatOpen: open }),
      toggleDesktopChat: () => set((s) => ({ desktopChatOpen: !s.desktopChatOpen })),
    }),
    {
      name: "misfits-mail-layout",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        desktopSidebarOpen: state.desktopSidebarOpen,
        desktopChatOpen: state.desktopChatOpen,
      }),
    },
  ),
);
