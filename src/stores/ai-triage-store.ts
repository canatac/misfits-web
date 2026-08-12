"use client";
import { create } from "zustand";
import type { TriageResult } from "@/types/ai-triage";
import type { Email } from "@/types/email";
import { triageEmail, triageBatch } from "@/lib/ai-triage";

interface TriageStore {
  triageResults: Record<string, TriageResult>;
  summaries: Record<string, string>;
  isProcessing: boolean;
  processingCount: number;
  triageEmail: (email: Email) => Promise<void>;
  triageBatch: (emails: Email[]) => Promise<void>;
  getTriage: (emailId: string) => TriageResult | undefined;
  getSummary: (emailId: string) => string | undefined;
  clearTriage: () => void;
}

export const useTriageStore = create<TriageStore>((set, get) => ({
  triageResults: {},
  summaries: {},
  isProcessing: false,
  processingCount: 0,

  triageEmail: async (email) => {
    const result = await triageEmail(email);
    set((s) => ({
      triageResults: { ...s.triageResults, [email.id]: result },
    }));
  },

  triageBatch: async (emails) => {
    set({ isProcessing: true, processingCount: emails.length });
    const results = await triageBatch(emails);
    const map: Record<string, TriageResult> = {};
    results.forEach((r, i) => {
      map[emails[i].id] = r;
    });
    set((s) => ({
      triageResults: { ...s.triageResults, ...map },
      isProcessing: false,
      processingCount: 0,
    }));
  },

  getTriage: (emailId) => get().triageResults[emailId],
  getSummary: (emailId) => get().summaries[emailId],
  clearTriage: () => set({ triageResults: {}, summaries: {} }),
}));
