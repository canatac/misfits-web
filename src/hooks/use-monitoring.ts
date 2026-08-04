"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getMonitoringActiveAlerts,
  getMonitoringEvents,
  getMonitoringSummary,
  getMonitoringTopProviders,
  getMonitoringTrace,
} from "@/lib/monitoring-api";
import { loadSession } from "@/lib/session";
import type {
  MonitoringEventFilters,
  MonitoringWindow,
  SmtpEvent,
} from "@/types/monitoring";

const REFRESH_30S = 30_000;

function isMobileViewport(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 767px)").matches;
}

export function useMonitoringSummary(window: MonitoringWindow) {
  return useQuery({
    queryKey: ["monitoring", "summary", window],
    queryFn: () => getMonitoringSummary(window),
    refetchInterval: REFRESH_30S,
    staleTime: 10_000,
  });
}

export function useMonitoringAlerts(window: MonitoringWindow) {
  return useQuery({
    queryKey: ["monitoring", "alerts", window],
    queryFn: () => getMonitoringActiveAlerts(window),
    refetchInterval: REFRESH_30S,
    staleTime: 10_000,
  });
}

export function useMonitoringProviders(window: MonitoringWindow) {
  return useQuery({
    queryKey: ["monitoring", "providers", window],
    queryFn: () => getMonitoringTopProviders(window),
    refetchInterval: REFRESH_30S,
    staleTime: 10_000,
  });
}

export function useMonitoringEvents(filters: MonitoringEventFilters) {
  return useQuery({
    queryKey: ["monitoring", "events", filters],
    queryFn: () => getMonitoringEvents(filters),
    placeholderData: (prev) => prev,
  });
}

export function useMonitoringTrace(messageId: string | null) {
  return useQuery({
    queryKey: ["monitoring", "trace", messageId],
    queryFn: () => getMonitoringTrace(messageId ?? ""),
    enabled: Boolean(messageId),
    refetchInterval: REFRESH_30S,
    staleTime: 10_000,
  });
}

export interface UseMonitoringLiveOptions {
  enabled?: boolean;
  messageId?: string;
}

export function useMonitoringLive(options: UseMonitoringLiveOptions = {}) {
  const { enabled = true, messageId } = options;
  const [events, setEvents] = useState<SmtpEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const retryRef = useRef<number>(0);
  const reconnectTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const update = () => setIsMobile(isMobileViewport());
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const streamUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (messageId?.trim()) params.set("message_id", messageId.trim());

    const email = loadSession()?.user?.email?.trim();
    if (email) params.set("user_email", email);

    const q = params.toString();
    return q ? `/api/monitoring/live?${q}` : "/api/monitoring/live";
  }, [messageId]);

  useEffect(() => {
    if (!enabled || isMobile) {
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

      source.addEventListener("smtp_event", (evt) => {
        try {
          const parsed = JSON.parse((evt as MessageEvent).data) as SmtpEvent;
          setEvents((prev) => [parsed, ...prev].slice(0, 50));
        } catch {
          // Ignore malformed payloads and keep stream alive.
        }
      });

      source.onmessage = (evt) => {
        // Some proxies may downgrade named events to default message events.
        try {
          const parsed = JSON.parse(evt.data) as SmtpEvent;
          setEvents((prev) => [parsed, ...prev].slice(0, 50));
        } catch {
          // heartbeat/comments are ignored.
        }
      };

      source.onerror = () => {
        setIsConnected(false);
        source?.close();

        retryRef.current += 1;
        const delay = Math.min(10_000, 1000 * 2 ** Math.min(retryRef.current, 4));
        setLastError(`Reconnexion dans ${Math.round(delay / 1000)}s`);
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
  }, [enabled, isMobile, streamUrl]);

  return {
    events,
    isConnected,
    isMobile,
    lastError,
  };
}
