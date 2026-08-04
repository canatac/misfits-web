import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { SmtpEvent } from "@/types/monitoring";
import {
  displayNullable,
  eventTypeClass,
  formatLocalTimestamp,
  riskTextClass,
} from "@/components/monitoring/utils";

interface LiveMonitorProps {
  events: SmtpEvent[];
  isConnected: boolean;
  isMobile: boolean;
  lastError: string | null;
  messageFilter: string;
  onMessageFilterChange: (value: string) => void;
}

export function LiveMonitor({
  events,
  isConnected,
  isMobile,
  lastError,
  messageFilter,
  onMessageFilterChange,
}: LiveMonitorProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Live Monitor</CardTitle>
            <CardDescription>Flux SSE en temps reel (50 derniers evenements)</CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant={isConnected ? "success" : "secondary"}
              className={isConnected ? "animate-pulse" : ""}
            >
              LIVE
            </Badge>
            <span className="text-xs text-[var(--color-muted-fg)]">
              {isMobile ? "SSE desactive sur mobile" : isConnected ? "connecte" : "deconnecte"}
            </span>
          </div>
        </div>

        <Input
          value={messageFilter}
          onChange={(evt) => onMessageFilterChange(evt.target.value)}
          placeholder="Filtrer le flux live par message_id"
          className="max-w-md"
        />

        {lastError ? <p className="text-xs text-[var(--color-warning-700)]">{lastError}</p> : null}
      </CardHeader>

      <CardContent>
        <div className="max-h-[420px] overflow-y-auto rounded-[var(--radius-md)] border border-[var(--color-border)]">
          {events.length === 0 ? (
            <div className="p-6 text-center text-sm text-[var(--color-muted-fg)]">Aucun evenement live pour le moment.</div>
          ) : (
            <ul className="divide-y divide-[var(--color-border)]">
              {events.map((event) => (
                <li key={event.id} className={`border-l-4 px-3 py-2 ${eventTypeClass(event.event_type)}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs text-[var(--color-muted-fg)]">{formatLocalTimestamp(event.ts)}</span>
                    <span className="text-xs uppercase tracking-wide">{event.event_type}</span>
                  </div>
                  <div className="mt-1 grid gap-1 text-sm md:grid-cols-2">
                    <span>
                      {displayNullable(event.from)} - {displayNullable(event.to)}
                    </span>
                    <span>
                      provider: {displayNullable(event.company)} / {displayNullable(event.country)}
                    </span>
                    <span>status: {displayNullable(event.status)}</span>
                    <span className={riskTextClass(event.risk_score)}>
                      risk: {displayNullable(event.risk_score)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
