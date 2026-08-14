"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  CheckCircle2,
  Circle,
  Sparkles,
  GripVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useCalendarStore } from "@/stores/calendar-store";
import { useCalendarEvents, useCalendarMutations } from "@/hooks/use-calendar";
import type { CalendarView } from "@/types/calendar";
import { CalendarGrid } from "./calendar-grid";
import { EventModal } from "./event-modal";
import { toast } from "sonner";

const VIEW_LABELS: Record<CalendarView, string> = {
  day: "Day",
  week: "Week",
  month: "Month",
};

const SMART_TASKS = [
  "Répondre au contrat Q4",
  "Valider copy onboarding mail",
  "Revue sécurité du matin",
  "Synchroniser roadmap sprint",
];

interface CountryOption {
  code: string;
  label: string;
}

interface PublicHolidayApiItem {
  date: string;
  localName: string;
  name: string;
  countryCode: string;
}

interface NagerCountryItem {
  countryCode: string;
  name: string;
}

interface RestCountryItem {
  cca2: string;
  name?: { common?: string };
  translations?: { fra?: { common?: string } | string };
}

function holidayKey(date: string, title: string): string {
  return `${date}|${title.trim().toLowerCase()}`;
}

function formatDateHeader(date: string, view: CalendarView): string {
  const d = new Date(date);
  const opts: Intl.DateTimeFormatOptions =
    view === "month"
      ? { month: "long", year: "numeric" }
      : view === "week"
        ? { month: "short", day: "numeric", year: "numeric" }
        : { weekday: "long", month: "long", day: "numeric", year: "numeric" };
  return d.toLocaleDateString("en-US", opts);
}

export function CalendarPage() {
  const view = useCalendarStore((s) => s.view);
  const setView = useCalendarStore((s) => s.setView);
  const selectedDate = useCalendarStore((s) => s.selectedDate);
  const setSelectedDate = useCalendarStore((s) => s.setSelectedDate);
  const events = useCalendarStore((s) => s.events);
  const { createEvent } = useCalendarMutations();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [doneTasks, setDoneTasks] = useState<Record<number, boolean>>({});
  const [selectedHolidayCountries, setSelectedHolidayCountries] = useState<
    string[]
  >(["FR"]);
  const [holidayCountryOptions, setHolidayCountryOptions] = useState<
    CountryOption[]
  >([]);
  const [holidayCountriesSearch, setHolidayCountriesSearch] = useState("");
  const [holidaySupportedCodes, setHolidaySupportedCodes] = useState<Set<string>>(
    () => new Set()
  );
  const [loadingHolidayCountries, setLoadingHolidayCountries] = useState(false);
  const [importingHolidays, setImportingHolidays] = useState(false);

  const { rangeStart, rangeEnd } = useMemo(() => {
    const d = new Date(selectedDate);
    if (view === "month") {
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      return { rangeStart: start.toISOString(), rangeEnd: end.toISOString() };
    }
    if (view === "week") {
      const day = d.getDay();
      const start = new Date(d);
      start.setDate(d.getDate() - day);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59);
      return { rangeStart: start.toISOString(), rangeEnd: end.toISOString() };
    }
    const start = new Date(d);
    start.setHours(0, 0, 0);
    const end = new Date(d);
    end.setHours(23, 59, 59);
    return { rangeStart: start.toISOString(), rangeEnd: end.toISOString() };
  }, [selectedDate, view]);

  const { isLoading } = useCalendarEvents({ start: rangeStart, end: rangeEnd });

  useEffect(() => {
    let cancelled = false;

    async function loadHolidayCountries() {
      setLoadingHolidayCountries(true);
      try {
        const [worldRes, supportedRes] = await Promise.allSettled([
          fetch(
            "https://raw.githubusercontent.com/mledoze/countries/master/countries.json"
          ),
          fetch("https://date.nager.at/api/v3/AvailableCountries"),
        ]);

        let options: CountryOption[] = [];
        if (worldRes.status === "fulfilled" && worldRes.value.ok) {
          const world = (await worldRes.value.json()) as RestCountryItem[];
          options = world
            .filter((c) => typeof c.cca2 === "string" && c.cca2.length === 2)
            .map((c) => {
              const frTranslation =
                typeof c.translations?.fra === "string"
                  ? c.translations.fra
                  : c.translations?.fra?.common;
              return {
                code: c.cca2.toUpperCase(),
                label: frTranslation || c.name?.common || c.cca2.toUpperCase(),
              };
            })
            .sort((a, b) => a.label.localeCompare(b.label, "fr"));
        }

        let supported = new Set<string>();
        if (supportedRes.status === "fulfilled" && supportedRes.value.ok) {
          const nager = (await supportedRes.value.json()) as NagerCountryItem[];
          supported = new Set(
            nager
              .map((country) => country.countryCode?.toUpperCase())
              .filter((code): code is string => Boolean(code))
          );
        }

        if (!cancelled) {
          setHolidayCountryOptions(options);
          setHolidaySupportedCodes(supported);
        }
      } catch {
        if (!cancelled) {
          toast.error("Impossible de charger la liste mondiale des pays");
        }
      } finally {
        if (!cancelled) {
          setLoadingHolidayCountries(false);
        }
      }
    }

    loadHolidayCountries();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredHolidayCountryOptions = useMemo(() => {
    const q = holidayCountriesSearch.trim().toLowerCase();
    if (!q) return holidayCountryOptions;
    return holidayCountryOptions.filter((country) => {
      return (
        country.label.toLowerCase().includes(q) ||
        country.code.toLowerCase().includes(q)
      );
    });
  }, [holidayCountriesSearch, holidayCountryOptions]);

  async function importPublicHolidays() {
    if (selectedHolidayCountries.length === 0) {
      toast.error("Sélectionnez au moins un pays");
      return;
    }

    const selectedYear = new Date(selectedDate).getFullYear();
    setImportingHolidays(true);

    try {
      const fetchResults = await Promise.allSettled(
        selectedHolidayCountries.map(async (countryCode) => {
          const response = await fetch(
            `https://date.nager.at/api/v3/PublicHolidays/${selectedYear}/${countryCode}`
          );
          if (!response.ok) {
            throw new Error(`${countryCode} (${response.status})`);
          }
          const data =
            (await response.json()) as PublicHolidayApiItem[];
          return data;
        })
      );

      const failedCountries: string[] = [];
      const fetchedHolidays: PublicHolidayApiItem[] = [];
      fetchResults.forEach((result, idx) => {
        if (result.status === "fulfilled") {
          fetchedHolidays.push(...result.value);
          return;
        }
        failedCountries.push(selectedHolidayCountries[idx]);
      });

      if (fetchedHolidays.length === 0) {
        throw new Error("Aucun jour férié récupéré");
      }

      const existingKeys = new Set(
        events.map((event) =>
          holidayKey(event.start.slice(0, 10), event.title)
        )
      );
      const toCreate: {
        title: string;
        description: string;
        start: string;
        end: string;
        eventType: "reminder";
        color: string;
        location: string;
      }[] = [];

      fetchedHolidays.forEach((holiday) => {
        const title = `${holiday.localName || holiday.name} (${holiday.countryCode})`;
        const key = holidayKey(holiday.date, title);
        if (existingKeys.has(key)) return;
        existingKeys.add(key);
        toCreate.push({
          title,
          description: `Jour férié importé (${holiday.countryCode})`,
          start: `${holiday.date}T09:00:00.000Z`,
          end: `${holiday.date}T10:00:00.000Z`,
          eventType: "reminder",
          color: "#EF4444",
          location: holiday.countryCode,
        });
      });

      if (toCreate.length === 0) {
        toast.message("Aucun nouveau jour férié à importer");
        return;
      }

      const createResults = await Promise.allSettled(
        toCreate.map((event) => createEvent.mutateAsync(event))
      );
      const createdCount = createResults.filter(
        (r) => r.status === "fulfilled"
      ).length;
      const failedCreates = createResults.length - createdCount;

      toast.success(
        `${createdCount} jour${createdCount === 1 ? "" : "s"} férié${createdCount === 1 ? "" : "s"} importé${createdCount === 1 ? "" : "s"}`
      );

      if (failedCountries.length > 0 || failedCreates > 0) {
        const warnings: string[] = [];
        if (failedCountries.length > 0) {
          warnings.push(`Pays indisponibles: ${failedCountries.join(", ")}`);
        }
        if (failedCreates > 0) {
          warnings.push(
            `${failedCreates} création${failedCreates === 1 ? "" : "s"} en échec`
          );
        }
        toast.warning(warnings.join(" · "));
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? `Import impossible: ${error.message}`
          : "Import impossible"
      );
    } finally {
      setImportingHolidays(false);
    }
  }

  function navigate(direction: -1 | 1) {
    const d = new Date(selectedDate);
    if (view === "month") d.setMonth(d.getMonth() + direction);
    else if (view === "week") d.setDate(d.getDate() + direction * 7);
    else d.setDate(d.getDate() + direction);
    setSelectedDate(d.toISOString().slice(0, 10));
  }

  return (
    <div
      className="flex h-full w-full overflow-hidden bg-[#0A0A0B] text-[#E0E0E0]"
      data-testid="calendar-page"
    >
      <aside className="hidden w-80 flex-col border-r border-[#242427] bg-[#121214] p-5 xl:flex">
        <div className="mb-4 flex items-center justify-between border-b border-[#242427] pb-3">
          <div className="flex items-center gap-2">
            <div className="rounded-lg border border-[#242427] bg-[#1D1D20] p-1.5">
              <CheckCircle2 className="h-4 w-4 text-[#C49B66]" />
            </div>
            <h2 className="text-sm font-bold text-white">
              Tâches prioritaires
            </h2>
          </div>
          <Sparkles className="h-4 w-4 text-[#C49B66]" />
        </div>

        <div className="space-y-2.5 overflow-y-auto pr-1">
          {SMART_TASKS.map((task, idx) => {
            const done = Boolean(doneTasks[idx]);
            return (
              <button
                key={task}
                type="button"
                onClick={() =>
                  setDoneTasks((prev) => ({ ...prev, [idx]: !prev[idx] }))
                }
                className={cn(
                  "flex w-full items-center justify-between rounded-2xl border px-3 py-2 text-left text-xs",
                  done
                    ? "border-[#242427] bg-[#121214] text-[#71717A]"
                    : "border-[#242427] bg-[#161619] text-[#E0E0E0] hover:border-[#C49B66]/60"
                )}
              >
                <div className="flex items-center gap-2">
                  {done ? (
                    <CheckCircle2 className="h-4 w-4 text-[#C49B66]" />
                  ) : (
                    <Circle className="h-4 w-4" />
                  )}
                  <span className={done ? "line-through" : ""}>{task}</span>
                </div>
                <GripVertical className="h-4 w-4 text-[#71717A]" />
              </button>
            );
          })}
        </div>

        <div className="mt-5 border-t border-[#242427] pt-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-xs font-bold tracking-wide text-white uppercase">
              Jours fériés
            </h3>
            <span className="text-[10px] text-[#71717A]">
              {new Date(selectedDate).getFullYear()}
            </span>
          </div>

          <Input
            value={holidayCountriesSearch}
            onChange={(e) => setHolidayCountriesSearch(e.target.value)}
            placeholder="Rechercher un pays (nom ou code ISO)"
            className="mb-2 border-[#242427] bg-[#161619] text-xs"
            aria-label="Rechercher un pays"
          />

          <div className="mb-2 flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 border-[#242427] bg-[#161619] px-2 text-[10px]"
              onClick={() =>
                setSelectedHolidayCountries(
                  holidayCountryOptions.map((country) => country.code)
                )
              }
              disabled={holidayCountryOptions.length === 0}
            >
              Tout cocher
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 border-[#242427] bg-[#161619] px-2 text-[10px]"
              onClick={() => setSelectedHolidayCountries([])}
              disabled={selectedHolidayCountries.length === 0}
            >
              Tout décocher
            </Button>
          </div>

          <div className="max-h-64 space-y-2 overflow-y-auto rounded-xl border border-[#242427] bg-[#161619] p-3">
            {loadingHolidayCountries && (
              <p className="text-xs text-[#71717A]">Chargement des pays…</p>
            )}
            {!loadingHolidayCountries && filteredHolidayCountryOptions.length === 0 && (
              <p className="text-xs text-[#71717A]">Aucun pays trouvé</p>
            )}
            {!loadingHolidayCountries &&
              filteredHolidayCountryOptions.map((country) => {
                const checked = selectedHolidayCountries.includes(country.code);
                const supported = holidaySupportedCodes.has(country.code);
                return (
                  <label
                    key={country.code}
                    className="flex cursor-pointer items-center justify-between gap-2 text-xs text-[#D4D4D8]"
                  >
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate">{country.label}</span>
                      <span className="text-[10px] text-[#71717A]">
                        {country.code}
                        {!supported ? " · API jours fériés indisponible" : ""}
                      </span>
                    </span>
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(value) => {
                        setSelectedHolidayCountries((prev) => {
                          if (value === true && !prev.includes(country.code)) {
                            return [...prev, country.code];
                          }
                          if (value !== true) {
                            return prev.filter((code) => code !== country.code);
                          }
                          return prev;
                        });
                      }}
                      aria-label={`Activer ${country.label}`}
                    />
                  </label>
                );
              })}
          </div>

          <Button
            onClick={importPublicHolidays}
            loading={importingHolidays}
            className="mt-3 w-full bg-[#C49B66] text-[#0A0A0B] hover:bg-[#d5ad78]"
          >
            Importer les jours fériés
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="mx-4 mt-4 rounded-2xl border border-[#242427] bg-[#121214] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h1 className="text-sm font-bold text-white">
                Planning intelligent
              </h1>
              <div className="hidden rounded-xl border border-[#242427] bg-[#1D1D20] px-3 py-1 font-mono text-xs text-[#C49B66] lg:flex">
                Créneaux recommandés: Lun 10:00, Mar 14:00, Mer 11:30
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="border border-[#242427] bg-[#1D1D20] hover:bg-[#242427]"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="rounded-lg border border-[#242427] bg-[#1D1D20] p-0.5">
                {(Object.keys(VIEW_LABELS) as CalendarView[]).map((v) => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={cn(
                      "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                      view === v
                        ? "bg-[#C49B66] text-[#0A0A0B]"
                        : "text-[#A1A1AA] hover:bg-[#242427] hover:text-white"
                    )}
                  >
                    {VIEW_LABELS[v]}
                  </button>
                ))}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(1)}
                className="border border-[#242427] bg-[#1D1D20] hover:bg-[#242427]"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => {
                  setEditingId(null);
                  setModalOpen(true);
                }}
                className="gap-1.5 bg-[#C49B66] text-[#0A0A0B] hover:bg-[#d5ad78]"
              >
                <Plus className="h-4 w-4" />
                New Event
              </Button>
            </div>
          </div>
          <p className="mt-2 text-xs text-[#71717A]">
            {formatDateHeader(selectedDate, view)}
          </p>
        </div>

        <div className="m-4 min-h-0 flex-1 overflow-hidden rounded-2xl border border-[#242427] bg-[#121214] p-3">
          <CalendarGrid
            view={view}
            selectedDate={selectedDate}
            events={events}
            isLoading={isLoading}
            onEventClick={(id) => {
              setEditingId(id);
              setModalOpen(true);
            }}
            onDayClick={(date) => {
              setSelectedDate(date);
              setView("day");
            }}
          />
        </div>
      </div>

      <EventModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        eventId={editingId}
        defaultDate={selectedDate}
      />
    </div>
  );
}
