import { Activity, Gauge, ShieldAlert, Timer } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { MonitoringSummary, MonitoringWindow } from "@/types/monitoring";
import { displayNullable, riskTextClass } from "@/components/monitoring/utils";

interface KpiCardsProps {
  window: MonitoringWindow;
  onWindowChange: (window: MonitoringWindow) => void;
  summary: MonitoringSummary | undefined;
  isLoading: boolean;
}

function KpiCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <Skeleton className="h-4 w-24" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-20" />
      </CardContent>
    </Card>
  );
}

export function KpiCards({
  window,
  onWindowChange,
  summary,
  isLoading,
}: KpiCardsProps) {
  const deliveryPct = Math.max(
    0,
    Math.min(100, (summary?.delivery_rate ?? 0) * 100)
  );
  const statusBars = Object.entries(summary?.by_status ?? {});

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">KPIs</h2>
          <p className="text-sm text-[var(--color-muted-fg)]">
            Rafraichissement automatique toutes les 30s
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-[var(--color-muted-fg)]">Fenetre</span>
          <Select
            value={window}
            onValueChange={(value) => onWindowChange(value as MonitoringWindow)}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Selectionner" />
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
      </div>

      {!isLoading && (
        <Card>
          <CardContent className="grid gap-3 p-4 md:grid-cols-[180px_1fr]">
            <div className="flex flex-col items-center justify-center gap-2">
              <div
                className="relative h-24 w-24 rounded-full"
                style={{
                  background: `conic-gradient(var(--color-success-500) ${deliveryPct}%, var(--color-danger-400) ${deliveryPct}% 100%)`,
                }}
              >
                <div className="absolute inset-2 grid place-items-center rounded-full bg-[var(--color-card)] text-sm font-semibold">
                  {deliveryPct.toFixed(1)}%
                </div>
              </div>
              <div className="text-xs text-[var(--color-muted-fg)]">
                Delivery gauge
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">Status sparklines</div>
              {statusBars.length === 0 ? (
                <div className="text-xs text-[var(--color-muted-fg)]">
                  Aucune donnee sur la fenetre selectionnee.
                </div>
              ) : (
                statusBars.map(([status, count]) => {
                  const total = Math.max(1, summary?.total_events ?? 1);
                  const pct = (count / total) * 100;
                  return (
                    <div key={status} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="tracking-wide uppercase">
                          {status}
                        </span>
                        <span>{count}</span>
                      </div>
                      <div className="h-2 rounded-full bg-[var(--color-muted)]">
                        <div
                          className="h-2 rounded-full bg-[var(--color-brand-500)]"
                          style={{ width: `${Math.max(4, pct)}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading ? (
          <>
            <KpiCardSkeleton />
            <KpiCardSkeleton />
            <KpiCardSkeleton />
            <KpiCardSkeleton />
          </>
        ) : (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Delivery Rate</CardDescription>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Activity className="h-4 w-4 text-[var(--color-success-600)]" />{" "}
                  Delivery
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[var(--color-success-700)]">
                  {summary
                    ? `${(summary.delivery_rate * 100).toFixed(1)}%`
                    : displayNullable(undefined)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Bounce Rate</CardDescription>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <ShieldAlert className="h-4 w-4 text-[var(--color-warning-600)]" />{" "}
                  Bounce
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[var(--color-warning-700)]">
                  {summary
                    ? `${(summary.bounce_rate * 100).toFixed(1)}%`
                    : displayNullable(undefined)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>P95 latency</CardDescription>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Timer className="h-4 w-4 text-[var(--color-info-600)]" />{" "}
                  Latence
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[var(--color-info-700)]">
                  {summary
                    ? displayNullable(
                        summary.p95_total_ms === null
                          ? null
                          : `${Math.round(summary.p95_total_ms)} ms`
                      )
                    : displayNullable(undefined)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Avg Risk Score</CardDescription>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Gauge className="h-4 w-4 text-[var(--color-danger-600)]" />{" "}
                  Risk
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold ${riskTextClass(summary?.avg_risk_score)}`}
                >
                  {summary
                    ? summary.avg_risk_score.toFixed(1)
                    : displayNullable(undefined)}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </section>
  );
}
