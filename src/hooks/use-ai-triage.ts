"use client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTriageStore } from "@/stores/ai-triage-store";
import { triageEmail, triageBatch, summarizeEmail } from "@/lib/ai-triage";
import type { Email } from "@/types/email";

export function useTriageEmail() {
  const store = useTriageStore();
  return useMutation({
    mutationFn: (email: Email) => triageEmail(email),
    onSuccess: (result) => {
      useTriageStore.setState((s) => ({
        triageResults: { ...s.triageResults, [result.emailId]: result },
      }));
    },
  });
}

export function useTriageBatch() {
  return useMutation({
    mutationFn: (emails: Email[]) => triageBatch(emails),
    onSuccess: (results) => {
      const map: Record<string, typeof results[0]> = {};
      results.forEach((r) => { map[r.emailId] = r; });
      useTriageStore.setState((s) => ({
        triageResults: { ...s.triageResults, ...map },
      }));
    },
  });
}

export function useEmailSummary(email: Email | null) {
  return useQuery({
    queryKey: ["summary", email?.id],
    queryFn: async () => {
      if (!email) return null;
      return summarizeEmail(email);
    },
    enabled: !!email,
    staleTime: Infinity,
  });
}

export function useTriageStats() {
  const results = useTriageStore((s) => s.triageResults);
  const stats: Record<string, number> = {};
  let urgent = 0;
  Object.values(results).forEach((r) => {
    stats[r.category] = (stats[r.category] || 0) + 1;
    if (r.needsUrgentReply) urgent++;
  });
  return { stats, urgent, total: Object.keys(results).length };
}
