import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { SecurityAlert } from "@/types/security";
import { actionIcon, formatIsoLocal, securitySeverityClass } from "@/components/security/utils";

interface AlertsPanelProps {
  alerts: SecurityAlert[];
  isLoading: boolean;
  onRollback: (alertId: string) => void;
  rollingBackAlertId?: string | null;
}

export function AlertsPanel({ alerts, isLoading, onRollback, rollingBackAlertId }: AlertsPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Alertes actives</CardTitle>
        <CardDescription>Flux de remediation en cours (observe/enforce)</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[var(--color-muted)]/60 text-left">
                <tr>
                  <th className="px-3 py-2">ts</th>
                  <th className="px-3 py-2">rule</th>
                  <th className="px-3 py-2">severity</th>
                  <th className="px-3 py-2">action</th>
                  <th className="px-3 py-2">tenant</th>
                  <th className="px-3 py-2">status</th>
                  <th className="px-3 py-2 text-right">ops</th>
                </tr>
              </thead>
              <tbody>
                {alerts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-6 text-center text-[var(--color-muted-fg)]">
                      Aucune alerte active.
                    </td>
                  </tr>
                ) : (
                  alerts.map((alert) => {
                    const rollbackEnabled = alert.mode === "enforce" && alert.status === "active";
                    return (
                      <tr key={alert.id} className="border-b border-[var(--color-border)]">
                        <td className="px-3 py-2 whitespace-nowrap">{formatIsoLocal(alert.ts)}</td>
                        <td className="px-3 py-2">
                          <div className="font-medium">{alert.rule_name}</div>
                          <div className="text-xs text-[var(--color-muted-fg)]">{alert.rule_id}</div>
                        </td>
                        <td className="px-3 py-2">
                          <Badge className={securitySeverityClass(alert.severity)}>{alert.severity}</Badge>
                        </td>
                        <td className="px-3 py-2">{actionIcon(alert.action)} {alert.action}</td>
                        <td className="px-3 py-2">{alert.tenant_id ?? "—"}</td>
                        <td className="px-3 py-2">{alert.status}</td>
                        <td className="px-3 py-2 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!rollbackEnabled || rollingBackAlertId === alert.id}
                            onClick={() => {
                              if (!window.confirm("Confirmer le rollback de cette remediation ?")) return;
                              onRollback(alert.id);
                            }}
                          >
                            Rollback
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
