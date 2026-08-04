import { AlertTriangle, Siren } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { MonitoringAlert } from "@/types/monitoring";
import { formatLocalTimestamp } from "@/components/monitoring/utils";

interface AlertBannerProps {
  alerts: MonitoringAlert[];
  isLoading: boolean;
}

function severityClass(severity: string): string {
  if (severity === "critical") {
    return "border-[var(--color-danger-300)] bg-[var(--color-danger-50)] text-[var(--color-danger-700)]";
  }
  return "border-[var(--color-warning-300)] bg-[var(--color-warning-50)] text-[var(--color-warning-800)]";
}

export function AlertBanner({ alerts, isLoading }: AlertBannerProps) {
  if (isLoading) {
    return <Skeleton className="h-20 w-full" />;
  }

  if (!alerts.length) {
    return (
      <Card className="border-[var(--color-success-200)] bg-[var(--color-success-50)]">
        <CardContent className="flex items-center gap-3 p-4 text-sm text-[var(--color-success-700)]">
          <Siren className="h-4 w-4" />
          Aucun incident actif sur la fenetre selectionnee.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {alerts.map((alert, idx) => (
        <Card key={`${alert.kind}-${alert.ts}-${idx}`} className={severityClass(alert.severity)}>
          <CardContent className="flex items-start justify-between gap-3 p-4 text-sm">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4" />
              <div>
                <div className="font-semibold">{alert.message}</div>
                <div className="text-xs opacity-80">
                  {alert.kind} - valeur {alert.value} / seuil {alert.threshold}
                </div>
              </div>
            </div>
            <div className="whitespace-nowrap text-xs opacity-80">
              {formatLocalTimestamp(alert.ts)}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
