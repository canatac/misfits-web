import { X } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { MonitoringTrace } from "@/types/monitoring";
import {
  displayNullable,
  formatLocalTimestamp,
  riskTextClass,
} from "@/components/monitoring/utils";

interface MessageTraceProps {
  open: boolean;
  trace: MonitoringTrace | undefined;
  isLoading: boolean;
  onClose: () => void;
}

const STAGES = [
  "accepted",
  "dns_lookup",
  "mx_selected",
  "smtp_connect",
  "tls_ok",
  "delivered",
];

function DurationBar({
  dns = 0,
  connect = 0,
  tls = 0,
}: {
  dns?: number;
  connect?: number;
  tls?: number;
}) {
  const total = Math.max(1, dns + connect + tls);
  const dnsPct = (dns / total) * 100;
  const connectPct = (connect / total) * 100;
  const tlsPct = (tls / total) * 100;

  return (
    <div className="space-y-1">
      <div className="h-3 w-full overflow-hidden rounded-full bg-[var(--color-muted)]">
        <div className="flex h-full">
          <div
            className="bg-[var(--color-info-500)]"
            style={{ width: `${dnsPct}%` }}
          />
          <div
            className="bg-[var(--color-warning-500)]"
            style={{ width: `${connectPct}%` }}
          />
          <div
            className="bg-[var(--color-success-500)]"
            style={{ width: `${tlsPct}%` }}
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-[var(--color-muted-fg)]">
        <span>dns_ms: {dns}</span>
        <span>connect_ms: {connect}</span>
        <span>tls_ms: {tls}</span>
      </div>
    </div>
  );
}

export function MessageTrace({
  open,
  trace,
  isLoading,
  onClose,
}: MessageTraceProps) {
  return (
    <aside
      className={`fixed inset-y-0 right-0 z-[var(--z-modal)] w-full max-w-xl transform border-l border-[var(--color-border)] bg-[var(--color-card)] shadow-[var(--shadow-xl)] transition-transform duration-300 ${
        open ? "translate-x-0" : "translate-x-full"
      }`}
      aria-hidden={!open}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
          <div>
            <h3 className="text-base font-semibold">Message Trace</h3>
            <p className="text-xs text-[var(--color-muted-fg)]">
              Details de routage SMTP
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {isLoading ? (
            <>
              <Skeleton className="h-44 w-full" />
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-32 w-full" />
            </>
          ) : !trace ? (
            <Card>
              <CardContent className="p-6 text-sm text-[var(--color-muted-fg)]">
                Selectionnez un message dans la table des evenements.
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Timeline</CardTitle>
                  <CardDescription>
                    accepted - dns_lookup - mx_selected - smtp_connect - tls_ok
                    - delivered
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {STAGES.map((stage) => {
                    const item = trace.trace.find(
                      (evt) => evt.event_type === stage
                    );
                    const done = Boolean(item);
                    return (
                      <div key={stage} className="flex items-start gap-3">
                        <div
                          className={`mt-1 h-3 w-3 rounded-full ${
                            done
                              ? "bg-[var(--color-success-500)]"
                              : "bg-[var(--color-muted)]"
                          }`}
                        />
                        <div className="flex-1 border-l border-[var(--color-border)] pl-3">
                          <div className="text-sm font-medium">{stage}</div>
                          <div className="text-xs text-[var(--color-muted-fg)]">
                            {done ? formatLocalTimestamp(item?.ts) : "—"}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Waterfall Durations</CardTitle>
                  <CardDescription>
                    dns_ms / connect_ms / tls_ms
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DurationBar
                    dns={
                      trace.trace.find((evt) => evt.event_type === "dns_lookup")
                        ?.dns_ms
                    }
                    connect={
                      trace.trace.find(
                        (evt) => evt.event_type === "smtp_connect"
                      )?.connect_ms
                    }
                    tls={
                      trace.trace.find((evt) => evt.event_type === "tls_ok")
                        ?.tls_ms
                    }
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Diagnostic</CardTitle>
                  <CardDescription>
                    smtp_code, smtp_reply, bounce_reason, risk_score
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {(() => {
                    const latest = trace.trace[trace.trace.length - 1];
                    return (
                      <>
                        <div className="flex justify-between gap-3">
                          <span className="text-[var(--color-muted-fg)]">
                            smtp_code
                          </span>
                          <span>{displayNullable(latest?.smtp_code)}</span>
                        </div>
                        <div className="flex justify-between gap-3">
                          <span className="text-[var(--color-muted-fg)]">
                            smtp_reply
                          </span>
                          <span className="max-w-[240px] text-right">
                            {displayNullable(latest?.smtp_reply)}
                          </span>
                        </div>
                        <div className="flex justify-between gap-3">
                          <span className="text-[var(--color-muted-fg)]">
                            bounce_reason
                          </span>
                          <span className="max-w-[240px] text-right">
                            {displayNullable(latest?.bounce_reason)}
                          </span>
                        </div>
                        <div className="flex justify-between gap-3">
                          <span className="text-[var(--color-muted-fg)]">
                            risk_score
                          </span>
                          <span
                            className={`font-semibold ${riskTextClass(latest?.risk_score)}`}
                          >
                            {displayNullable(latest?.risk_score)}
                          </span>
                        </div>
                      </>
                    );
                  })()}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
