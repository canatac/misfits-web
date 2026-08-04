"use client";

import { useMemo, useState } from "react";
import { AlertBanner } from "@/components/monitoring/alert-banner";
import { EventsTable } from "@/components/monitoring/events-table";
import { KpiCards } from "@/components/monitoring/kpi-cards";
import { LiveMonitor } from "@/components/monitoring/live-monitor";
import { MessageTrace } from "@/components/monitoring/message-trace";
import { ProvidersTable } from "@/components/monitoring/providers-table";
import {
  useMonitoringAlerts,
  useMonitoringEvents,
  useMonitoringLive,
  useMonitoringProviders,
  useMonitoringSummary,
  useMonitoringTrace,
} from "@/hooks/use-monitoring";
import type { MonitoringEventFilters, MonitoringWindow } from "@/types/monitoring";

const DEFAULT_WINDOW: MonitoringWindow = "15m";

export default function MonitoringPage() {
  const [window, setWindow] = useState<MonitoringWindow>(DEFAULT_WINDOW);
  const [filters, setFilters] = useState<MonitoringEventFilters>({ page: 1, page_size: 50 });
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [traceOpen, setTraceOpen] = useState(false);
  const [liveMessageFilter, setLiveMessageFilter] = useState("");

  const summaryQuery = useMonitoringSummary(window);
  const alertsQuery = useMonitoringAlerts("1h");
  const providersQuery = useMonitoringProviders(window);
  const eventsQuery = useMonitoringEvents(filters);
  const traceQuery = useMonitoringTrace(selectedMessageId);

  const live = useMonitoringLive({
    enabled: true,
    messageId: liveMessageFilter.trim() || undefined,
  });

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
    <main className="mx-auto w-full max-w-[1440px] space-y-5 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold">Monitoring SMTP</h1>
        <p className="text-sm text-[var(--color-muted-fg)]">
          Supervision de delivrabilite, performance, risques et flux live.
        </p>
      </div>

      <AlertBanner
        alerts={alertsQuery.data?.alerts ?? []}
        isLoading={alertsQuery.isLoading}
      />

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
            onPageChange={(nextPage) =>
              setFilters((prev) => ({ ...prev, page: Math.max(1, nextPage), page_size: 50 }))
            }
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
        </div>
      </div>

      <MessageTrace
        open={traceOpen}
        trace={traceQuery.data}
        isLoading={traceQuery.isLoading}
        onClose={() => setTraceOpen(false)}
      />
    </main>
  );
}
