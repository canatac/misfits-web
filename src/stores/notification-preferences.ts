"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type NotificationSound = "chime" | "bell" | "pop" | "none";

export interface NotificationPreferences {
  enabled: boolean;
  browserPermission: NotificationPermission | "default";
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  vipOnly: boolean;
  sound: NotificationSound;
  folderPrefs: Record<string, boolean>;
}

interface NotificationPreferencesState {
  prefs: NotificationPreferences;
  hydrated: boolean;
  setHydrated: (h: boolean) => void;
  updatePrefs: (partial: Partial<NotificationPreferences>) => void;
  setFolderPref: (folder: string, enabled: boolean) => void;
  requestBrowserPermission: () => Promise<NotificationPermission>;
  clearPermission: () => void;
  isInQuietHours: () => boolean;
  shouldNotifyForEmail: (opts: { folder: string; isStarred: boolean }) => boolean;
  showNotification: (title: string, body: string) => void;
}

const DEFAULT_PREFS: NotificationPreferences = {
  enabled: false,
  browserPermission: "default",
  quietHoursEnabled: false,
  quietHoursStart: "22:00",
  quietHoursEnd: "07:00",
  vipOnly: false,
  sound: "chime",
  folderPrefs: {
    inbox: true,
    sent: false,
    drafts: false,
    archive: false,
    trash: false,
    spam: false,
  },
};

export const useNotificationPreferences = create<NotificationPreferencesState>()(
  persist(
    (set, get) => ({
      prefs: DEFAULT_PREFS,
      hydrated: false,
      setHydrated: (h) => set({ hydrated: h }),
      updatePrefs: (partial) => set((s) => ({ prefs: { ...s.prefs, ...partial } })),
      setFolderPref: (folder, enabled) =>
        set((s) => ({
          prefs: {
            ...s.prefs,
            folderPrefs: { ...s.prefs.folderPrefs, [folder]: enabled },
          },
        })),
      requestBrowserPermission: async () => {
        if (typeof window === "undefined" || !("Notification" in window)) {
          set((s) => ({ prefs: { ...s.prefs, browserPermission: "denied", enabled: false } }));
          return "denied" as NotificationPermission;
        }
        const perm = await Notification.requestPermission();
        set((s) => ({
          prefs: { ...s.prefs, browserPermission: perm, enabled: perm === "granted" },
        }));
        return perm;
      },
      clearPermission: () =>
        set((s) => ({ prefs: { ...s.prefs, browserPermission: "default", enabled: false } })),
      isInQuietHours: () => {
        const { quietHoursEnabled, quietHoursStart, quietHoursEnd } = get().prefs;
        if (!quietHoursEnabled) return false;
        const now = new Date();
        const nowMin = now.getHours() * 60 + now.getMinutes();
        const [sh, sm] = quietHoursStart.split(":").map(Number);
        const [eh, em] = quietHoursEnd.split(":").map(Number);
        const startMin = sh * 60 + sm;
        const endMin = eh * 60 + em;
        if (startMin <= endMin) {
          return nowMin >= startMin && nowMin < endMin;
        }
        return nowMin >= startMin || nowMin < endMin;
      },
      shouldNotifyForEmail: ({ folder, isStarred }) => {
        const { enabled, vipOnly, folderPrefs } = get().prefs;
        if (!enabled) return false;
        if (get().isInQuietHours()) return false;
        if (vipOnly && !isStarred) return false;
        return folderPrefs[folder] ?? false;
      },
      showNotification: (title, body) => {
        const { sound } = get().prefs;
        if (get().isInQuietHours()) return;
        if (typeof window !== "undefined" && "Notification" in window) {
          if (Notification.permission === "granted") {
            const n = new Notification(title, { body, icon: "/icons/mail-192.png" });
            if (sound && sound !== "none") {
              try {
                const audio = new Audio(`/sounds/${sound}.mp3`);
                audio.volume = 0.5;
                audio.play().catch(() => {});
              } catch {}
            }
            n.onclick = () => { window.focus(); n.close(); };
            setTimeout(() => n.close(), 8000);
          }
        }
      },
    }),
    {
      name: "misfits-notification-prefs",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ prefs: state.prefs }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
        if (typeof window !== "undefined" && "Notification" in window && state) {
          const perm = Notification.permission;
          if (perm !== state.prefs.browserPermission) {
            state.updatePrefs({ browserPermission: perm, enabled: perm === "granted" });
          }
        }
      },
    }
  )
);
