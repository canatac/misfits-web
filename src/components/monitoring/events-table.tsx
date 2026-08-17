import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { MonitoringEventFilters, SmtpEvent } from "@/types/monitoring";
import {
  displayNullable,
  formatLocalTimestamp,
  riskTextClass,
} from "@/components/monitoring/utils";
import { EventsTableFilters } from "@/components/monitoring/events-table-filters";

interface EventsTableProps {
  events: SmtpEvent[];
  total: number;
  page: number;
  isLoading: boolean;
  filters: MonitoringEventFilters;
  countries: string[];
  providers: string[];
  onFiltersChange: (next: MonitoringEventFilters) => void;
  onPageChange: (nextPage: number) => void;
  onSelectMessage: (messageId: string) => void;
}

const PAGE_SIZE = 50;

export function EventsTable({
  events,
  total,
  page,
  isLoading,
  filters,
  countries,
  providers,
  onFiltersChange,
  onPageChange,
  onSelectMessage,
}: EventsTableProps) {
  const hasPrevious = page > 1;
  const hasNext = page * PAGE_SIZE < total;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Events</CardTitle>
        <CardDescription>
          Filtrage status / pays / provider / message_id
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <EventsTableFilters
          filters={filters}
          countries={countries}
          providers={providers}
          onFiltersChange={onFiltersChange}
        />

        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
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
                  <th className="px-3 py-2 font-medium">ts</th>
                  <th className="px-3 py-2 font-medium">from - to</th>
                  <th className="px-3 py-2 font-medium">mx_host</th>
                  <th className="px-3 py-2 font-medium">country</th>
                  <th className="px-3 py-2 font-medium">company</th>
                  <th className="px-3 py-2 font-medium">status</th>
                  <th className="px-3 py-2 text-right font-medium">total_ms</th>
                  <th className="px-3 py-2 text-right font-medium">
                    risk_score
                  </th>
                  <th className="px-3 py-2 text-right font-medium">trace</th>
                </tr>
              </thead>
              <tbody>
                {events.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-3 py-6 text-center text-[var(--color-muted-fg)]"
                    >
                      Aucun evenement trouve.
                    </td>
                  </tr>
                ) : (
                  events.map((event) => (
                    <tr
                      key={event.id}
                      className="border-b border-[var(--color-border)]"
                    >
                      <td className="px-3 py-2 whitespace-nowrap">
                        {formatLocalTimestamp(event.ts)}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {displayNullable(event.from)} -{" "}
                        {displayNullable(event.to)}
                      </td>
                      <td className="px-3 py-2">
                        {displayNullable(event.mx_host)}
                      </td>
                      <td className="px-3 py-2">
                        {displayNullable(event.country)}
                      </td>
                      <td className="px-3 py-2">
                        {displayNullable(event.company)}
                      </td>
                      <td className="px-3 py-2">
                        {displayNullable(event.status)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {displayNullable(event.total_ms)}
                      </td>
                      <td
                        className={`px-3 py-2 text-right font-semibold ${riskTextClass(event.risk_score)}`}
                      >
                        {displayNullable(event.risk_score)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onSelectMessage(event.message_id)}
                        >
                          Ouvrir
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="text-xs text-[var(--color-muted-fg)]">
            {total} total - page {page}
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={!hasPrevious}
              onClick={() => onPageChange(page - 1)}
            >
              Precedent
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={!hasNext}
              onClick={() => onPageChange(page + 1)}
            >
              Suivant
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
