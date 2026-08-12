import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { MonitoringBouncesResponse } from "@/types/monitoring";
import {
  displayNullable,
  formatLocalTimestamp,
} from "@/components/monitoring/utils";

interface BouncesPanelProps {
  data: MonitoringBouncesResponse | undefined;
  isLoading: boolean;
}

export function BouncesPanel({ data, isLoading }: BouncesPanelProps) {
  const hard = data?.hard ?? 0;
  const soft = data?.soft ?? 0;
  const policy = data?.policy ?? 0;
  const total = Math.max(1, hard + soft + policy);

  const hardPct = (hard / total) * 100;
  const softPct = (soft / total) * 100;
  const policyPct = (policy / total) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bounces</CardTitle>
        <CardDescription>
          Distribution hard / soft / policy + raisons
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-24 w-24 rounded-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div
                className="relative h-24 w-24 rounded-full"
                style={{
                  background: `conic-gradient(var(--color-danger-500) 0 ${hardPct}%, var(--color-warning-500) ${hardPct}% ${hardPct + softPct}%, var(--color-info-500) ${hardPct + softPct}% 100%)`,
                }}
              >
                <div className="absolute inset-2 grid place-items-center rounded-full bg-[var(--color-card)] text-xs font-semibold">
                  {data?.total ?? 0}
                </div>
              </div>
              <div className="space-y-1 text-sm">
                <div>
                  <span className="font-medium text-[var(--color-danger-600)]">
                    Hard
                  </span>
                  : {hard} ({hardPct.toFixed(1)}%)
                </div>
                <div>
                  <span className="font-medium text-[var(--color-warning-600)]">
                    Soft
                  </span>
                  : {soft} ({softPct.toFixed(1)}%)
                </div>
                <div>
                  <span className="font-medium text-[var(--color-info-600)]">
                    Policy
                  </span>
                  : {policy} ({policyPct.toFixed(1)}%)
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-[var(--color-muted)]/60 text-left">
                  <tr>
                    <th className="px-3 py-2">ts</th>
                    <th className="px-3 py-2">to</th>
                    <th className="px-3 py-2">bounce_type</th>
                    <th className="px-3 py-2">bounce_reason</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.bounces ?? []).slice(0, 8).map((bounce) => (
                    <tr
                      key={bounce.id}
                      className="border-b border-[var(--color-border)]"
                    >
                      <td className="px-3 py-2 whitespace-nowrap">
                        {formatLocalTimestamp(bounce.ts)}
                      </td>
                      <td className="px-3 py-2">
                        {displayNullable(bounce.to)}
                      </td>
                      <td className="px-3 py-2">
                        {displayNullable(bounce.bounce_type)}
                      </td>
                      <td className="px-3 py-2">
                        {displayNullable(bounce.bounce_reason)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
