"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertBanner } from "@/components/monitoring/alert-banner";
import { BouncesPanel } from "@/components/monitoring/bounces-panel";
import { EventsTable } from "@/components/monitoring/events-table";
import { KpiCards } from "@/components/monitoring/kpi-cards";
import { LiveMonitor } from "@/components/monitoring/live-monitor";
import { MessageTrace } from "@/components/monitoring/message-trace";
import { ProvidersTable } from "@/components/monitoring/providers-table";
import {
  useMonitoringAlerts,
  useMonitoringBounces,
  useMonitoringEvents,
  useMonitoringLive,
  useMonitoringProviders,
  useMonitoringSummary,
  useMonitoringTrace,
} from "@/hooks/use-monitoring";
import type { MonitoringEventFilters, MonitoringWindow } from "@/types/monitoring";

const DEFAULT_WINDOW: MonitoringWindow = "15m";

function MonitoringDashboardContent() {
  const searchParams = useSearchParams();
  const [window, setWindow] = useState<MonitoringWindow>(DEFAULT_WINDOW);
  const [filters, setFilters] = useState<MonitoringEventFilters>({ page: 1, page_size: 50 });
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [traceOpen, setTraceOpen] = useState(false);
  const [liveMessageFilter, setLiveMessageFilter] = useState("");

  useEffect(() => {
    const messageFromQuery = searchParams.get("message_id")?.trim() || "";
    if (!messageFromQuery) return;
    setFilters((prev) => ({ ...prev, message_id: messageFromQuery, page: 1 }));
    setLiveMessageFilter(messageFromQuery);
    setSelectedMessageId(messageFromQuery);
    setTraceOpen(true);
  }, [searchParams]);

  const summaryQuery = useMonitoringSummary(window);
  const alertsQuery = useMonitoringAlerts(window);
  const providersQuery = useMonitoringProviders(window);
  const bouncesQuery = useMonitoringBounces(window);
  const eventsQuery = useMonitoringEvents(filters);
  const traceQuery = useMonitoringTrace(selectedMessageId);
  const live = useMonitoringLive({ enabled: true, messageId: liveMessageFilter.trim() || undefined });

  const countries = useMemo(() => {
    const values = new Set<string>();
    for (const event of eventsQuery.data?.events ?? []) {
      if (event.country) values.add(event.country);
    }
    return Array.from(values).sort();
  }, [eventsQuery.data?.events]);

  const providerNames = useMemo(() => {
    const values = new Set<string>();
    for (const provider of providersQuery.data?.providers ?? []) {
      if (provider.company) values.add(provider.company);
    }
    return Array.from(values).sort();
  }, [providersQuery.data?.providers]);

  return (
    <section className="space-y-5">
      <AlertBanner alerts={alertsQuery.data?.alerts ?? []} isLoading={alertsQuery.isLoading} />

      <KpiCards
        window={window}
        onWindowChange={setWindow}
        summary={summaryQuery.data}
        isLoading={summaryQuery.isLoading}
      />

      <div className="grid gap-5 xl:grid-cols-12">
        <div className="space-y-5 xl:col-span-8">
          <EventsTable
            events={eventsQuery.data?.events ?? []}
            total={eventsQuery.data?.total ?? 0}
            page={filters.page ?? 1}
            isLoading={eventsQuery.isLoading}
            filters={filters}
            countries={countries}
            providers={providerNames}
            onFiltersChange={setFilters}
            onPageChange={(nextPage) => setFilters((prev) => ({ ...prev, page: Math.max(1, nextPage), page_size: 50 }))}
            onSelectMessage={(messageId) => {
              setSelectedMessageId(messageId);
              setTraceOpen(true);
            }}
          />

          <LiveMonitor
            events={live.events}
            isConnected={live.isConnected}
            isMobile={live.isMobile}
            lastError={live.lastError}
            messageFilter={liveMessageFilter}
            onMessageFilterChange={setLiveMessageFilter}
          />
        </div>

        <div className="space-y-5 xl:col-span-4">
          <ProvidersTable
            providers={providersQuery.data?.providers ?? []}
            isLoading={providersQuery.isLoading}
          />
          <BouncesPanel data={bouncesQuery.data} isLoading={bouncesQuery.isLoading} />
        </div>
      </div>

      <MessageTrace
        open={traceOpen}
        trace={traceQuery.data}
        isLoading={traceQuery.isLoading}
        onClose={() => setTraceOpen(false)}
      />
    </section>
  );
}

export default function MonitoringDashboardPage() {
  return (
    <Suspense
      fallback={
        <section className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-card)] p-6 text-sm text-[var(--color-muted-fg)]">
          Chargement du monitoring...
        </section>
      }
    >
      <MonitoringDashboardContent />
    </Suspense>
  );
}
