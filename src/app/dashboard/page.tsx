"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckSquare,
  Inbox,
  Newspaper,
} from "lucide-react";
import { useI18n } from "@/i18n/provider";
import { useEmailList } from "@/hooks/use-emails";
import { useCalendarEvents } from "@/hooks/use-calendar";
import { useMonitoringAlerts, useMonitoringSummary } from "@/hooks/use-monitoring";
import { useSecurityActiveAlerts } from "@/hooks/use-security-dashboard";
import { useChangeRequests } from "@/hooks/use-admin-ops";
import { calculatePriority } from "@/lib/ai-triage";
import { selectEmailsFromLast24h, summarizeDailyMail } from "@/lib/daily-mail-summary";
import { summarizeDailyNewsletters } from "@/lib/daily-newsletter-summary";
import { onNewsletterUpdated } from "@/lib/newsletter-events";
import { listNewsletterItems } from "@/lib/newsletters-api";
import { BriefingCard } from "./_components/BriefingCard";
import { MetricsGrid, type Metric } from "./_components/MetricsGrid";
import { InboxScoresCard } from "./_components/InboxScoresCard";
import { VeilleCard } from "./_components/VeilleCard";
import { TasksCard } from "./_components/TasksCard";
import { AlertsCard } from "./_components/AlertsCard";
import { DetailView, type DetailItem } from "./_components/DetailView";
import type {
  DashboardAlertItem,
  DashboardDailyMailSummary,
  DashboardHighlight,
  DashboardNewsletterItem,
  DashboardTaskItem,
} from "./types";

function readNumber(
  obj: Record<string, unknown> | undefined,
  snakeKey: string,
  camelKey: string
): number | null {
  if (!obj) return null;
  const snake = obj[snakeKey];
  const camel = obj[camelKey];
  if (typeof snake === "number" && Number.isFinite(snake)) return snake;
  if (typeof camel === "number" && Number.isFinite(camel)) return camel;
  return null;
}

function toLocalHourMinute(iso: string, locale: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function severityStyle(severity: string) {
  const s = severity.toLowerCase();
  if (s === "critical") {
    return { accent: "#F87171", bg: "bg-[#200F0F]", border: "border-[#3D1515]" };
  }
  if (s === "high") {
    return { accent: "#FB923C", bg: "bg-[#1F130D]", border: "border-[#3E2415]" };
  }
  if (s === "medium") {
    return { accent: "#C49B66", bg: "bg-[#1D1611]", border: "border-[#3A2E1A]" };
  }
  return { accent: "#4ADE80", bg: "bg-[#0D1A11]", border: "border-[#1A3325]" };
}

function asSeverity(value: string): "critical" | "high" | "medium" | "low" | "info" {
  const s = value.toLowerCase();
  if (s === "critical" || s === "high" || s === "medium" || s === "low") return s;
  return "info";
}

export default function DashboardIndexPage() {
  const { locale, t } = useI18n();
  const loc = locale === "fr" ? "fr-FR" : "en-US";

  const [now, setNow] = useState<Date | null>(null);
  const [doneIds, setDoneIds] = useState<Set<string>>(() => new Set());
  const [detailItem, setDetailItem] = useState<DetailItem | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const toggle = (id: string) => {
    setDoneIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const inboxQuery = useEmailList({ folder: "inbox", page: 1, pageSize: 50, sortBy: "date" });
  const sentQuery = useEmailList({ folder: "sent", page: 1, pageSize: 50, sortBy: "date" });
  const unreadCountQuery = useEmailList({
    folder: "inbox",
    filterType: "unread",
    page: 1,
    pageSize: 1,
  });

  const dayRange = useMemo(() => {
    const base = now ?? new Date();
    const start = new Date(base);
    start.setHours(0, 0, 0, 0);
    const end = new Date(base);
    end.setHours(23, 59, 59, 999);
    return { start: start.toISOString(), end: end.toISOString() };
  }, [now]);

  const calendarQuery = useCalendarEvents(dayRange);
  const monitoringSummaryQuery = useMonitoringSummary("24h");
  const monitoringAlertsQuery = useMonitoringAlerts("24h");
  const securityAlertsQuery = useSecurityActiveAlerts({ window: "24h" });
  const changeRequestsQuery = useChangeRequests();
  const newsletterItemsQuery = useQuery({
    queryKey: ["newsletters", "items", "dashboard"],
    queryFn: listNewsletterItems,
    refetchInterval: 60_000,
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  });

  const refetchNewsletters = newsletterItemsQuery.refetch;

  useEffect(() => {
    return onNewsletterUpdated(() => {
      void refetchNewsletters();
    });
  }, [refetchNewsletters]);

  const dateLabel = useMemo(() => {
    if (!now) return "";
    const date = new Intl.DateTimeFormat(loc, {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(now).toUpperCase();
    const time = new Intl.DateTimeFormat(loc, {
      hour: "2-digit",
      minute: "2-digit",
    }).format(now);
    return `${date} • ${time}`;
  }, [now, loc]);

  const last24hEmails = useMemo(() => {
    const inbox = inboxQuery.data?.emails ?? [];
    const sent = sentQuery.data?.emails ?? [];
    const merged = [...inbox, ...sent];
    const dedup = new Map(merged.map((email) => [email.id, email]));
    return selectEmailsFromLast24h(Array.from(dedup.values()), now ?? new Date());
  }, [inboxQuery.data?.emails, sentQuery.data?.emails, now]);

  const actionableDailyEmails = useMemo(() => {
    return last24hEmails
      .map((email) => ({ ...email, score: calculatePriority(email) }))
      .sort((a, b) => b.score - a.score);
  }, [last24hEmails]);

  const dailyMailSummaryQuery = useQuery<DashboardDailyMailSummary>({
    queryKey: [
      "dashboard",
      "daily-mail-summary",
      ...last24hEmails.map((email) => `${email.id}:${email.isRead ? "r" : "u"}:${email.isStarred ? "s" : "n"}`),
    ],
    queryFn: async () => {
      const summary = await summarizeDailyMail(last24hEmails);
      return {
        mailboxActivity: summary.mailboxActivity,
        pendingActions: summary.pendingActions,
        exchangedInfo: summary.exchangedInfo,
        priorityEmails: summary.priorityEmails,
        generatedAt: summary.generatedAt,
        source: summary.source,
      };
    },
    staleTime: 5 * 60_000,
    refetchInterval: 5 * 60_000,
  });

  const allNewsletterItems = useMemo(
    () => newsletterItemsQuery.data ?? [],
    [newsletterItemsQuery.data]
  );

  const newsletterBrief = useMemo(
    () => summarizeDailyNewsletters(allNewsletterItems, now ?? new Date(), locale === "fr" ? "fr" : "en"),
    [allNewsletterItems, now, locale]
  );

  const greeting = newsletterBrief.text;

  const newsletterItems = useMemo<DashboardNewsletterItem[]>(() => {
    const source = allNewsletterItems;
    return source.slice(0, 4).map((item) => ({
      id: item.id,
      title: item.title,
      signal: item.signal,
      tags: [item.topic ? `#${String(item.topic).toLowerCase()}` : "#newsletter"],
      summary: item.summary,
      topic: item.topic,
      updatedAt: item.updatedAt,
      createdAt: item.createdAt,
      links: item.links,
      takeaways: item.links.map((link) => link.name).slice(0, 2),
    }));
  }, [allNewsletterItems]);

  const taskItems = useMemo<DashboardTaskItem[]>(() => {
    const events = (calendarQuery.data ?? [])
      .slice()
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
      .slice(0, 4)
      .map((e) => ({
        id: `cal-${e.id}`,
        label: e.title,
        ref: "Calendrier",
        details: e.description || "Événement agenda synchronisé.",
        due: toLocalHourMinute(e.start, loc),
        priority: e.eventType === "deadline" ? "high" : "medium",
      } satisfies DashboardTaskItem));

    const changeRequests = (changeRequestsQuery.data?.items ?? [])
      .filter((cr) => cr.status !== "released" && cr.status !== "rejected")
      .slice(0, 4)
      .map((cr) => ({
        id: `cr-${cr.id}`,
        label: cr.title,
        ref: "Change Request",
        details: `${cr.scope.toUpperCase()} · ${cr.status} · ${cr.priority}`,
        due: cr.targetReleaseWindow,
        priority: cr.priority === "P0" ? "high" : cr.priority === "P1" ? "medium" : "low",
      } satisfies DashboardTaskItem));

    return [...events, ...changeRequests].slice(0, 6);
  }, [calendarQuery.data, changeRequestsQuery.data?.items, loc]);

  const alertItems = useMemo<DashboardAlertItem[]>(() => {
    const mon = (monitoringAlertsQuery.data?.alerts ?? []).map((a, idx) => {
      const sev = asSeverity(a.severity);
      const style = severityStyle(sev);
      return {
        id: `mon-${idx}-${a.kind}`,
        title: `[SMTP] ${a.message}`,
        description: `Valeur ${a.value} (seuil ${a.threshold})`,
        time: toLocalHourMinute(a.ts, loc),
        cta: "Voir monitoring",
        ...style,
        severity: sev,
      } satisfies DashboardAlertItem;
    });

    const sec = (securityAlertsQuery.data?.alerts ?? []).map((a) => {
      const sev = asSeverity(a.severity);
      const style = severityStyle(sev);
      return {
        id: `sec-${a.id}`,
        title: `[SEC] ${a.rule_name}`,
        description: `${a.action} · confidence ${Math.round(a.confidence * 100)}%`,
        time: toLocalHourMinute(a.ts, loc),
        cta: "Voir sécurité",
        ...style,
        severity: sev,
      } satisfies DashboardAlertItem;
    });

    return [...sec, ...mon].slice(0, 6);
  }, [monitoringAlertsQuery.data?.alerts, securityAlertsQuery.data?.alerts, loc]);

  const unreadCount = unreadCountQuery.data?.total ?? 0;
  const highSignalNewsletters = newsletterItems.filter((v) => v.signal >= 80).length;
  const pendingTasks = taskItems.filter((task) => !doneIds.has(task.id)).length;
  const urgentTasks = taskItems.filter((task) => task.priority === "high").length;

  const metrics: Metric[] = [
    {
      label: t("dashboard.metrics.unread"),
      value: String(unreadCount),
      note: t("dashboard.metrics.receivedTonight"),
      icon: Inbox,
      tone: "text-[#C49B66]",
    },
    {
      label: t("dashboard.metrics.highSignal"),
      value: String(highSignalNewsletters),
      note: t("dashboard.metrics.newslettersHighSignal"),
      icon: Newspaper,
      tone: "text-[#4ADE80]",
    },
    {
      label: t("dashboard.metrics.actions"),
      value: String(pendingTasks),
      note:
        locale === "fr"
          ? `${urgentTasks} urgentes`
          : `${urgentTasks} urgent${urgentTasks === 1 ? "" : "s"}`,
      icon: CheckSquare,
      tone: "text-[#38BDF8]",
    },
    {
      label: t("dashboard.metrics.alerts"),
      value: String(alertItems.length),
      note:
        locale === "fr"
          ? "issues actives (monitoring + sécurité)"
          : "active issues (monitoring + security)",
      icon: AlertTriangle,
      tone: "text-amber-400",
    },
  ];

  const highlights: DashboardHighlight[] = useMemo(() => {
    const summary = monitoringSummaryQuery.data as unknown as Record<string, unknown> | undefined;
    const deliveryRateRaw = readNumber(summary, "delivery_rate", "deliveryRate");
    const bounceRateRaw = readNumber(summary, "bounce_rate", "bounceRate");
    const deliveryRate = deliveryRateRaw === null ? "n/a" : `${Math.round(deliveryRateRaw * 100)}%`;
    const bounceRate = bounceRateRaw === null ? "n/a" : `${Math.round(bounceRateRaw * 100)}%`;
    return [
      {
        color: "#4ADE80",
        category: locale === "fr" ? "Délivrabilité" : "Deliverability",
        text:
          locale === "fr"
            ? `Taux livré ${deliveryRate} (rebond ${bounceRate}) sur 24h.`
            : `Delivered ${deliveryRate} (bounce ${bounceRate}) over 24h.`,
      },
      {
        color: "#C49B66",
        category: locale === "fr" ? "Inbox" : "Inbox",
        text:
          locale === "fr"
            ? `${unreadCount} mails non lus actuellement.`
            : `${unreadCount} unread messages right now.`,
      },
      {
        color: "#38BDF8",
        category: locale === "fr" ? "Agenda" : "Agenda",
        text:
          locale === "fr"
            ? `${taskItems.length} événement(s) planifié(s) aujourd’hui.`
            : `${taskItems.length} event(s) scheduled today.`,
      },
      {
        color: "#F87171",
        category: locale === "fr" ? "Sécurité/Ops" : "Security/Ops",
        text:
          locale === "fr"
            ? `${alertItems.length} alerte(s) active(s) consolidées.`
            : `${alertItems.length} active consolidated alert(s).`,
      },
    ];
  }, [monitoringSummaryQuery.data, locale, unreadCount, taskItems.length, alertItems.length]);

  if (detailItem) {
    return <DetailView item={detailItem} onBack={() => setDetailItem(null)} />;
  }

  return (
    <section className="space-y-5 text-[#E0E0E0]">
      <BriefingCard
        dateLabel={dateLabel}
        badge={t("dashboard.badge")}
        greeting={greeting}
        highlights={highlights}
      >
        <MetricsGrid metrics={metrics} />
      </BriefingCard>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-4">
        <InboxScoresCard
          summary={dailyMailSummaryQuery.data}
          isLoading={dailyMailSummaryQuery.isLoading}
          actionableEmails={actionableDailyEmails}
          onOpen={(email) => setDetailItem({ type: "email", data: email })}
        />
        <VeilleCard
          items={newsletterItems}
          onOpen={(article) => setDetailItem({ type: "newsletter", data: article })}
        />
        <TasksCard
          tasks={taskItems}
          doneIds={doneIds}
          onToggle={(task) => {
            toggle(task.id);
            setDetailItem({ type: "task", data: task });
          }}
        />
        <AlertsCard
          alerts={alertItems}
          onOpen={(alert) => setDetailItem({ type: "alert", data: alert })}
        />
      </div>
    </section>
  );
}
