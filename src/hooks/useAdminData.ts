"use client";
// useAdminData.ts — extracted Sprint 6 from admin-console-page.tsx
// Loads security posture, deliverability diagnostics, observability overview
// and deliverability procedure; exposes saveProcedureUpdate.

import { useEffect, useState } from "react";
import type {
  AdminDeliverabilityDiagnosticsResponse,
  AdminObservabilityOverviewResponse,
  DeliverabilityProcedureData,
} from "@/types/admin-console";
import type { LocalSecurityPosture } from "@/components/admin/tabs/overview-sections/types";

export function useAdminData(windowRange: string) {
  const [securityPosture, setSecurityPosture] =
    useState<LocalSecurityPosture | null>(null);
  const [deliverability, setDeliverability] =
    useState<AdminDeliverabilityDiagnosticsResponse | null>(null);
  const [deliverabilityProcedure, setDeliverabilityProcedure] =
    useState<DeliverabilityProcedureData | null>(null);
  const [observability, setObservability] =
    useState<AdminObservabilityOverviewResponse | null>(null);
  const [adminDataLoading, setAdminDataLoading] = useState(false);
  const [adminDataError, setAdminDataError] = useState<string | null>(null);
  const [procedureSaving, setProcedureSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadAdminData() {
      setAdminDataLoading(true);
      setAdminDataError(null);
      try {
        const [securityRes, deliverabilityRes, observabilityRes, procedureRes] =
          await Promise.all([
            fetch(`/api/admin/security/posture?window=${windowRange}`, {
              cache: "no-store"
            }),
            fetch(
              `/api/admin/deliverability/diagnostics?window=${windowRange}`,
              {
                cache: "no-store"
              }
            ),
            fetch(`/api/admin/observability/overview?window=${windowRange}`, {
              cache: "no-store"
            }),
            fetch(`/api/admin/deliverability/procedure?window=${windowRange}`, {
              cache: "no-store"
            }),
          ]);

        if (
          !securityRes.ok ||
          !deliverabilityRes.ok ||
          !observabilityRes.ok ||
          !procedureRes.ok
        ) {
          throw new Error(
            `admin_api_status=${securityRes.status}/${deliverabilityRes.status}/${observabilityRes.status}/${procedureRes.status}`
          );
        }

        const [securityData, deliverabilityData, observabilityData, procedureData] =
          await Promise.all([
            securityRes.json(),
            deliverabilityRes.json(),
            observabilityRes.json(),
            procedureRes.json(),
          ]);

        if (cancelled) return;

        setSecurityPosture(securityData);
        setDeliverability(deliverabilityData);
        setObservability(observabilityData);
        setDeliverabilityProcedure(procedureData);
      } catch (error) {
        if (cancelled) return;
        setAdminDataError(
          error instanceof Error ? error.message : "admin_data_load_failed"
        );
      } finally {
        if (!cancelled) {
          setAdminDataLoading(false);
        }
      }
    }

    void loadAdminData();

    return () => {
      cancelled = true;
    };
  }, [windowRange]);

  async function saveProcedureUpdate(payload: {
    checklist?: Array<{ id: string; checked: boolean; note?: string }>;
    reminder?: { enabled: boolean; cadence_hours: number };
  }) {
    setProcedureSaving(true);
    try {
      const res = await fetch(`/api/admin/deliverability/procedure`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `procedure_update_failed_${res.status}`);
      }

      const fresh = await fetch(
        `/api/admin/deliverability/procedure?window=${windowRange}`,
        {
          cache: "no-store"
        }
      );
      if (fresh.ok) {
        setDeliverabilityProcedure(await fresh.json());
      }
    } catch (error) {
      setAdminDataError(
        error instanceof Error ? error.message : "deliverability_procedure_save_failed"
      );
    } finally {
      setProcedureSaving(false);
    }
  }

  return {
    securityPosture,
    deliverability,
    deliverabilityProcedure,
    observability,
    adminDataLoading,
    adminDataError,
    procedureSaving,
    saveProcedureUpdate,
  };
}
