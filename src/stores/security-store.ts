"use client";
import { create } from "zustand";
import type { PhishingResult } from "@/types/security";
import type { Email } from "@/types/email";
import { detectPhishing } from "@/lib/phishing-detector";

interface SecurityStore {
  results: Record<string, PhishingResult>;
  isScanning: boolean;
  lastScanId: string | null;
  scanEmail: (email: Email) => void;
  scanBatch: (emails: Email[]) => void;
  getResult: (emailId: string) => PhishingResult | undefined;
  clearResults: () => void;
}

export const useSecurityStore = create<SecurityStore>((set, get) => ({
  results: {},
  isScanning: false,
  lastScanId: null,

  scanEmail: (email) => {
    const result = detectPhishing(email);
    set((s) => ({
      results: { ...s.results, [email.id]: result },
      lastScanId: email.id,
    }));
  },

  scanBatch: (emails) => {
    set({ isScanning: true });
    const map: Record<string, PhishingResult> = {};
    emails.forEach((e) => {
      map[e.id] = detectPhishing(e);
    });
    set((s) => ({ results: { ...s.results, ...map }, isScanning: false }));
  },

  getResult: (emailId) => get().results[emailId],
  clearResults: () => set({ results: {} }),
}));
