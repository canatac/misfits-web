import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SensitivityLevel } from "@/lib/phishing-scanner";

export interface SecuritySettingsState {
  phishingSensitivity: SensitivityLevel;
  phishingAuditLog: PhishingAuditEntry[];
  setPhishingSensitivity: (level: SensitivityLevel) => void;
  addPhishingAuditEntry: (entry: PhishingAuditEntry) => void;
  clearPhishingAuditLog: () => void;
}

export interface PhishingAuditEntry {
  emailId: string;
  subject: string;
  from: string;
  threatLevel: string;
  score: number;
  indicatorsCount: number;
  scannedAt: string;
}

export const useSecuritySettingsStore = create<SecuritySettingsState>()(
  persist(
    (set) => ({
      phishingSensitivity: "medium",
      phishingAuditLog: [],
      setPhishingSensitivity: (level) => set({ phishingSensitivity: level }),
      addPhishingAuditEntry: (entry) => set((s) => ({ phishingAuditLog: [entry, ...s.phishingAuditLog].slice(0, 100) })),
      clearPhishingAuditLog: () => set({ phishingAuditLog: [] }),
    }),
    { name: "security-settings" }
  )
);
