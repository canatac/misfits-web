import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { MonitoringProvider } from "@/types/monitoring";
import { displayNullable, riskTextClass } from "@/components/monitoring/utils";

interface ProvidersTableProps {
  providers: MonitoringProvider[];
  isLoading: boolean;
}

export function ProvidersTable({ providers, isLoading }: ProvidersTableProps) {
  const sortedProviders = [...providers].sort((a, b) => b.count - a.count);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Providers</CardTitle>
        <CardDescription>Classement par volume et risque moyen</CardDescription>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[var(--color-muted)]/60 text-left">
                <tr>
                  <th className="px-3 py-2 font-medium">Company</th>
                  <th className="px-3 py-2 font-medium">Datacenter</th>
                  <th className="px-3 py-2 font-medium">Country</th>
                  <th className="px-3 py-2 text-right font-medium">Count</th>
                  <th className="px-3 py-2 font-medium">Delivery Rate</th>
                  <th className="px-3 py-2 text-right font-medium">Avg Risk</th>
                </tr>
              </thead>
              <tbody>
                {providers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-3 py-6 text-center text-[var(--color-muted-fg)]"
                    >
                      Aucun provider sur cette fenetre.
                    </td>
                  </tr>
                ) : (
                  sortedProviders.map((provider, idx) => (
                    <tr
                      key={`${provider.company}-${provider.datacenter}-${idx}`}
                      className="border-b border-[var(--color-border)]"
                    >
                      <td className="px-3 py-2">
                        {displayNullable(provider.company)}
                      </td>
                      <td className="px-3 py-2">
                        {displayNullable(provider.datacenter)}
                      </td>
                      <td className="px-3 py-2">
                        {displayNullable(provider.country)}
                      </td>
                      <td className="px-3 py-2 text-right">{provider.count}</td>
                      <td className="px-3 py-2">
                        {(() => {
                          const rate =
                            provider.count > 0
                              ? (provider.delivered / provider.count) * 100
                              : 0;
                          return (
                            <div className="space-y-1">
                              <div className="h-2 rounded-full bg-[var(--color-muted)]">
                                <div
                                  className="h-2 rounded-full bg-[var(--color-success-500)]"
                                  style={{ width: `${Math.max(4, rate)}%` }}
                                />
                              </div>
                              <div className="text-right text-xs text-[var(--color-muted-fg)]">
                                {rate.toFixed(1)}%
                              </div>
                            </div>
                          );
                        })()}
                      </td>
                      <td
                        className={`px-3 py-2 text-right font-semibold ${riskTextClass(provider.avg_risk_score)}`}
                      >
                        {provider.avg_risk_score.toFixed(1)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
