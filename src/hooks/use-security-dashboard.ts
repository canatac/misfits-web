"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getSecurityActiveAlerts,
  getSecurityIncidents,
  getSecurityTenantStatus,
  rollbackSecurityRemediation,
  type SecurityAlertsFilters,
  type SecurityIncidentsFilters,
} from "@/lib/security-api";
import type { SecurityAlert } from "@/types/security";

const ALERTS_POLL_MS = 60_000;

export function useSecurityActiveAlerts(filters: SecurityAlertsFilters) {
  return useQuery({
    queryKey: ["security", "active-alerts", filters],
    queryFn: () => getSecurityActiveAlerts(filters),
    refetchInterval: ALERTS_POLL_MS,
    staleTime: 10_000,
  });
}

export function useSecurityIncidents(filters: SecurityIncidentsFilters) {
  return useQuery({
    queryKey: ["security", "incidents", filters],
    queryFn: () => getSecurityIncidents(filters),
    placeholderData: (prev) => prev,
  });
}

export function useSecurityTenantStatus(tenantId: string | null) {
  return useQuery({
    queryKey: ["security", "tenant-status", tenantId],
    queryFn: () => getSecurityTenantStatus(tenantId ?? ""),
    enabled: Boolean(tenantId),
    refetchInterval: ALERTS_POLL_MS,
    staleTime: 10_000,
  });
}

export function useRollbackRemediation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (alertId: string) => rollbackSecurityRemediation(alertId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["security", "active-alerts"],
      });
      void queryClient.invalidateQueries({
        queryKey: ["security", "incidents"],
      });
      toast.success("Remediation rollback applique.");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Echec du rollback.");
    },
  });
}

export interface UseSecurityLiveOptions {
  enabled?: boolean;
}

export function useSecurityLive(options: UseSecurityLiveOptions = {}) {
  const { enabled = true } = options;
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastError, setLastError] = useState<string | null>(null);
  const retryRef = useRef<number>(0);
  const reconnectTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const onVisibility = () => {
      setIsVisible(document.visibilityState === "visible");
    };
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const streamUrl = useMemo(() => "/api/security/live", []);

  useEffect(() => {
    const supportsSse =
      typeof window !== "undefined" && "EventSource" in window;
    if (!enabled || !isVisible || !supportsSse) {
      setIsConnected(false);
      return;
    }

    let closed = false;
    let source: EventSource | null = null;

    const cleanupTimer = () => {
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };

    const connect = () => {
      if (closed) return;
      source = new EventSource(streamUrl);

      source.onopen = () => {
        retryRef.current = 0;
        setIsConnected(true);
        setLastError(null);
      };

      source.addEventListener("security_alert", (evt) => {
        try {
          const parsed = JSON.parse(
            (evt as MessageEvent).data
          ) as SecurityAlert;
          setAlerts((prev) => [parsed, ...prev].slice(0, 50));
          toast.warning(
            `${parsed.severity.toUpperCase()} - ${parsed.rule_name}`,
            {
              description: parsed.rule_id,
              action: {
                label: "Voir l'incident",
                onClick: () => {
                  window.location.href = "/dashboard/security";
                },
              },
            }
          );
        } catch {
          // ignore malformed event
        }
      });

      source.onmessage = (evt) => {
        try {
          const parsed = JSON.parse(evt.data) as SecurityAlert;
          setAlerts((prev) => [parsed, ...prev].slice(0, 50));
        } catch {
          // heartbeat ignored
        }
      };

      source.onerror = () => {
        setIsConnected(false);
        source?.close();
        retryRef.current += 1;
        const delay = Math.min(
          10_000,
          1000 * 2 ** Math.min(retryRef.current, 4)
        );
        setLastError(`Reconnexion securite dans ${Math.round(delay / 1000)}s`);
        cleanupTimer();
        reconnectTimerRef.current = window.setTimeout(connect, delay);
      };
    };

    connect();

    return () => {
      closed = true;
      cleanupTimer();
      source?.close();
      setIsConnected(false);
    };
  }, [enabled, isVisible, streamUrl]);

  return {
    alerts,
    isConnected,
    isVisible,
    lastError,
  };
}
