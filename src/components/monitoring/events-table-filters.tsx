import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { MonitoringEventFilters } from "@/types/monitoring";

interface EventsTableFiltersProps {
  filters: MonitoringEventFilters;
  countries: string[];
  providers: string[];
  onFiltersChange: (next: MonitoringEventFilters) => void;
}

export function EventsTableFilters({
  filters,
  countries,
  providers,
  onFiltersChange,
}: EventsTableFiltersProps) {
  return (
    <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
      <Select
        value={filters.status || "all"}
        onValueChange={(value) =>
          onFiltersChange({
            ...filters,
            status: value === "all" ? undefined : value,
            page: 1,
          })
        }
      >
        <SelectTrigger>
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous statuts</SelectItem>
          <SelectItem value="pending">pending</SelectItem>
          <SelectItem value="delivered">delivered</SelectItem>
          <SelectItem value="deferred">deferred</SelectItem>
          <SelectItem value="bounced">bounced</SelectItem>
          <SelectItem value="failed">failed</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.country || "all"}
        onValueChange={(value) =>
          onFiltersChange({
            ...filters,
            country: value === "all" ? undefined : value,
            page: 1,
          })
        }
      >
        <SelectTrigger>
          <SelectValue placeholder="Country" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous pays</SelectItem>
          {countries.map((country) => (
            <SelectItem key={country} value={country}>
              {country}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.provider || "all"}
        onValueChange={(value) =>
          onFiltersChange({
            ...filters,
            provider: value === "all" ? undefined : value,
            page: 1,
          })
        }
      >
        <SelectTrigger>
          <SelectValue placeholder="Provider" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous providers</SelectItem>
          {providers.map((provider) => (
            <SelectItem key={provider} value={provider}>
              {provider}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        value={filters.message_id || ""}
        placeholder="message_id"
        onChange={(evt) =>
          onFiltersChange({
            ...filters,
            message_id: evt.target.value.trim() || undefined,
            page: 1,
          })
        }
      />
    </div>
  );
}
