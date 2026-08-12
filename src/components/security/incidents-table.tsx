import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { SecurityAlert } from "@/types/security";
import {
  actionIcon,
  formatIsoLocal,
  securitySeverityClass,
} from "@/components/security/utils";
import { Badge } from "@/components/ui/badge";

interface IncidentsTableProps {
  incidents: SecurityAlert[];
  total: number;
  page: number;
  isLoading: boolean;
  onPageChange: (page: number) => void;
}

export function IncidentsTable({
  incidents,
  total,
  page,
  isLoading,
  onPageChange,
}: IncidentsTableProps) {
  const hasPrev = page > 1;
  const hasNext = page * 20 < total;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Incidents</CardTitle>
        <CardDescription>
          Historique complet active/resolved/rolled_back
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
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
                  <th className="px-3 py-2">ip/country</th>
                  <th className="px-3 py-2">status</th>
                </tr>
              </thead>
              <tbody>
                {incidents.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-3 py-6 text-center text-[var(--color-muted-fg)]"
                    >
                      Aucun incident.
                    </td>
                  </tr>
                ) : (
                  incidents.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-[var(--color-border)]"
                    >
                      <td className="px-3 py-2 whitespace-nowrap">
                        {formatIsoLocal(item.ts)}
                      </td>
                      <td className="px-3 py-2">
                        <div className="font-medium">{item.rule_name}</div>
                        <div className="text-xs text-[var(--color-muted-fg)]">
                          {item.rule_id}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <Badge className={securitySeverityClass(item.severity)}>
                          {item.severity}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        {actionIcon(item.action)} {item.action}
                      </td>
                      <td className="px-3 py-2">
                        {item.ip ?? "—"} / {item.country ?? "—"}
                      </td>
                      <td className="px-3 py-2">{item.status}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-[var(--color-muted-fg)]">
          <span>
            Total: {total} - page {page}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded border border-[var(--color-border)] px-2 py-1 disabled:opacity-50"
              disabled={!hasPrev}
              onClick={() => onPageChange(page - 1)}
            >
              Precedent
            </button>
            <button
              type="button"
              className="rounded border border-[var(--color-border)] px-2 py-1 disabled:opacity-50"
              disabled={!hasNext}
              onClick={() => onPageChange(page + 1)}
            >
              Suivant
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
