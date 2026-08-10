"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface MailLayoutState {
  hydrated: boolean;
  desktopSidebarOpen: boolean;
  desktopChatOpen: boolean;
  desktopHeaderOpen: boolean;
  desktopConsoleOpen: boolean;
  setHydrated: (hydrated: boolean) => void;
  setDesktopSidebarOpen: (open: boolean) => void;
  toggleDesktopSidebar: () => void;
  setDesktopChatOpen: (open: boolean) => void;
  toggleDesktopChat: () => void;
  setDesktopHeaderOpen: (open: boolean) => void;
  toggleDesktopHeader: () => void;
  setDesktopConsoleOpen: (open: boolean) => void;
  toggleDesktopConsole: () => void;
}

export const useMailLayoutStore = create<MailLayoutState>()(
  persist(
    (set) => ({
      hydrated: false,
      desktopSidebarOpen: false,
      desktopChatOpen: false,
      desktopHeaderOpen: true,
      desktopConsoleOpen: false,
      setHydrated: (hydrated) => set({ hydrated }),
      setDesktopSidebarOpen: (open) => set({ desktopSidebarOpen: open }),
      toggleDesktopSidebar: () =>
        set((s) => ({ desktopSidebarOpen: !s.desktopSidebarOpen })),
      setDesktopChatOpen: (open) => set({ desktopChatOpen: open }),
      toggleDesktopChat: () => set((s) => ({ desktopChatOpen: !s.desktopChatOpen })),
      setDesktopHeaderOpen: (open) => set({ desktopHeaderOpen: open }),
      toggleDesktopHeader: () => set((s) => ({ desktopHeaderOpen: !s.desktopHeaderOpen })),
      setDesktopConsoleOpen: (open) => set({ desktopConsoleOpen: open }),
      toggleDesktopConsole: () => set((s) => ({ desktopConsoleOpen: !s.desktopConsoleOpen })),
    }),
    {
      name: "misfits-mail-layout",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        desktopSidebarOpen: state.desktopSidebarOpen,
        desktopChatOpen: state.desktopChatOpen,
        desktopHeaderOpen: state.desktopHeaderOpen,
        desktopConsoleOpen: state.desktopConsoleOpen,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
