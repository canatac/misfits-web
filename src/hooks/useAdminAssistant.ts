"use client";
// useAdminAssistant.ts — extracted Sprint 6 from admin-console-page.tsx
// Wraps the Hermes-backed operator plan assistant (prompt state + snapshot memo + POST /api/hermes/chat).

import { useMemo, useState } from "react";

export function useAdminAssistant(snapshotDeps: {
  windowRange: string;
  severity: string;
  monitoringSummary: unknown;
  monitoringAlerts: unknown;
  securityActive: unknown;
  monitoringProviders: unknown;
  monitoringBounces: unknown;
  monitoringLiveEvents: unknown[];
  securityLiveAlerts: unknown[];
  observability: unknown;
  deliverability: unknown;
  deliverabilityProcedure: unknown;
  securityPosture: unknown;
  adminDataLoading: boolean;
  adminDataError: string | null;
}) {
  const [assistantPrompt, setAssistantPrompt] = useState(
    "Fais-moi un résumé de la situation actuelle et les actions prioritaires à lancer dans les 2 prochaines heures."
  );
  const [assistantAnswer, setAssistantAnswer] = useState<string>("");
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [assistantError, setAssistantError] = useState<string | null>(null);

  const adminAssistantSnapshot = useMemo(
    () => ({
      window: snapshotDeps.windowRange,
      severity: snapshotDeps.severity,
      summary: (snapshotDeps.monitoringSummary as { data?: unknown })?.data ?? null,
      monitoring_alerts:
        (snapshotDeps.monitoringAlerts as { data?: { alerts?: unknown[] } })?.data?.alerts?.slice(0, 15) ?? [],
      security_alerts:
        (snapshotDeps.securityActive as { data?: { alerts?: unknown[] } })?.data?.alerts?.slice(0, 15) ?? [],
      providers:
        (snapshotDeps.monitoringProviders as { data?: { providers?: unknown[] } })?.data?.providers?.slice(0, 10) ?? [],
      bounces:
        (snapshotDeps.monitoringBounces as { data?: { bounces?: unknown[] } })?.data?.bounces?.slice(0, 10) ?? [],
      monitoring_live: snapshotDeps.monitoringLiveEvents.slice(0, 12),
      security_live: snapshotDeps.securityLiveAlerts.slice(0, 12),
      observability: snapshotDeps.observability,
      deliverability: snapshotDeps.deliverability,
      deliverability_procedure: snapshotDeps.deliverabilityProcedure,
      security_posture: snapshotDeps.securityPosture,
      admin_data_loading: snapshotDeps.adminDataLoading,
      admin_data_error: snapshotDeps.adminDataError
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    Object.values(snapshotDeps)
  );

  async function askHermesForAdminPlan() {
    const prompt = assistantPrompt.trim();
    if (!prompt) {
      setAssistantError("Merci de saisir une demande.");
      return;
    }

    setAssistantLoading(true);
    setAssistantError(null);

    try {
      const response = await fetch("/api/hermes/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content:
                "Tu es Hermes, copilote SRE/DevOps de la console admin misfits.ai Mail. Réponds en français, de façon actionnable et concise. Donne exactement deux sections: 1) Résumé opérationnel (4-6 puces), 2) Actions à réaliser (checklist priorisée P0/P1/P2 avec commandes/étapes de vérification). Si des données sont absentes ou incohérentes, indique clairement les vérifications à lancer."
            },
            {
              role: "user",
              content: `Contexte observabilité/sécurité (JSON):\n${JSON.stringify(
                adminAssistantSnapshot
              )}\n\nDemande opérateur:\n${prompt}`
            },
          ],
          sessionId: "admin-console-operations",
          sessionKey: "misfits-admin-console",
          temperature: 0.2
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `hermes_request_failed_${response.status}`);
      }

      const data = await response.json();
      const content =
        data?.choices?.[0]?.message?.content ??
        data?.content ??
        "Aucune réponse Hermes reçue.";

      setAssistantAnswer(
        typeof content === "string" ? content : JSON.stringify(content)
      );
    } catch (error) {
      setAssistantError(
        error instanceof Error ? error.message : "Erreur lors de l’appel Hermes."
      );
    } finally {
      setAssistantLoading(false);
    }
  }

  return {
    assistantPrompt,
    setAssistantPrompt,
    assistantAnswer,
    assistantLoading,
    assistantError,
    adminAssistantSnapshot,
    askHermesForAdminPlan,
  };
}
