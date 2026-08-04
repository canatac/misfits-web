"use client";

import { useMemo, useState } from "react";
import { ShieldAlert } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  useRollbackRemediation,
  useSecurityActiveAlerts,
  useSecurityIncidents,
  useSecurityLive,
  useSecurityTenantStatus,
} from "@/hooks/use-security-dashboard";
import { AlertsPanel } from "@/components/security/alerts-panel";
import { IncidentsTable } from "@/components/security/incidents-table";
import { TenantStatusCard } from "@/components/security/tenant-status-card";
import type { SecuritySeverity } from "@/types/security";

export default function SecurityDashboardPage() {
  const [window, setWindow] = useState("1h");
  const [severity, setSeverity] = useState<SecuritySeverity | "all">("all");
  const [tenantId, setTenantId] = useState("");
  const [page, setPage] = useState(1);

  const severityFilter = severity === "all" ? undefined : severity;

  const activeQuery = useSecurityActiveAlerts({ window, severity: severityFilter, tenant_id: tenantId || undefined });
  const incidentsQuery = useSecurityIncidents({ page, page_size: 20, severity: severityFilter, tenant_id: tenantId || undefined });
  const tenantStatusQuery = useSecurityTenantStatus(tenantId || null);
  const rollbackMutation = useRollbackRemediation();
  const securityLive = useSecurityLive({ enabled: true });

  const liveTop = useMemo(() => securityLive.alerts.slice(0, 5), [securityLive.alerts]);

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end gap-3 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-card)] p-4">
        <div className="min-w-[120px]">
          <div className="mb-1 text-xs text-[var(--color-muted-fg)]">Fenetre</div>
          <Select value={window} onValueChange={setWindow}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="15m">15m</SelectItem>
              <SelectItem value="1h">1h</SelectItem>
              <SelectItem value="6h">6h</SelectItem>
              <SelectItem value="24h">24h</SelectItem>
              <SelectItem value="7d">7d</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="min-w-[140px]">
          <div className="mb-1 text-xs text-[var(--color-muted-fg)]">Severity</div>
          <Select value={severity} onValueChange={(value) => setSeverity(value as SecuritySeverity | "all")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">all</SelectItem>
              <SelectItem value="info">info</SelectItem>
              <SelectItem value="low">low</SelectItem>
              <SelectItem value="medium">medium</SelectItem>
              <SelectItem value="high">high</SelectItem>
              <SelectItem value="critical">critical</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="min-w-[260px] flex-1">
          <div className="mb-1 text-xs text-[var(--color-muted-fg)]">tenant_id</div>
          <Input
            value={tenantId}
            placeholder="tenant-42"
            onChange={(evt) => {
              setTenantId(evt.target.value.trim());
              setPage(1);
            }}
          />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Badge variant={securityLive.isConnected ? "success" : "secondary"} className={securityLive.isConnected ? "animate-pulse" : ""}>
            LIVE
          </Badge>
          <span className="text-xs text-[var(--color-muted-fg)]">
            {securityLive.isConnected ? "connecte" : "deconnecte"}
          </span>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-12">
        <div className="space-y-5 xl:col-span-8">
          <AlertsPanel
            alerts={activeQuery.data?.alerts ?? []}
            isLoading={activeQuery.isLoading}
            onRollback={(alertId) => rollbackMutation.mutate(alertId)}
            rollingBackAlertId={rollbackMutation.variables ?? null}
          />

          <IncidentsTable
            incidents={incidentsQuery.data?.alerts ?? []}
            total={incidentsQuery.data?.count ?? 0}
            page={page}
            isLoading={incidentsQuery.isLoading}
            onPageChange={setPage}
          />
        </div>

        <div className="space-y-5 xl:col-span-4">
          <TenantStatusCard tenantId={tenantId} state={tenantStatusQuery.data?.state} />

          <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-card)] p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <ShieldAlert className="h-4 w-4 text-[var(--color-danger-600)]" />
              Dernieres alertes live
            </div>
            <ul className="space-y-2 text-sm">
              {liveTop.length === 0 ? (
                <li className="text-[var(--color-muted-fg)]">Aucune alerte live.</li>
              ) : (
                liveTop.map((alert) => (
                  <li key={alert.id} className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-2">
                    <div className="font-medium">{alert.rule_name}</div>
                    <div className="text-xs text-[var(--color-muted-fg)]">{alert.severity} - {alert.action}</div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
