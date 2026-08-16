"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  CheckSquare,
  Inbox,
  Newspaper,
  X,
} from "lucide-react";
import { useI18n } from "@/i18n/provider";
import { useAuthStore } from "@/stores/auth-store";
import { useEmailList } from "@/hooks/use-emails";
import { VEILLE, TASKS, ALERTS } from "./dashboard-fixtures";
import { INBOX_SCORES } from "./_data/sample-content";
import { BriefingCard } from "./_components/BriefingCard";
import { MetricsGrid, type Metric } from "./_components/MetricsGrid";
import { InboxScoresCard } from "./_components/InboxScoresCard";
import { VeilleCard } from "./_components/VeilleCard";
import { TasksCard } from "./_components/TasksCard";
import { AlertsCard } from "./_components/AlertsCard";
import { StorageModal } from "./_components/StorageModal";
import { DetailView, type DetailItem } from "./_components/DetailView";

export default function DashboardIndexPage() {
  const { locale, t } = useI18n();
  const user = useAuthStore((s) => s.user);

  const [now, setNow] = useState<Date | null>(null);
  const [doneIds, setDoneIds] = useState<Set<string>>(() => new Set(["t3"]));
  const [detailItem, setDetailItem] = useState<DetailItem | null>(null);
  const [storagePercentage, setStoragePercentage] = useState(84.2);
  const [showStorageModal, setShowStorageModal] = useState(false);
  const [cleanupDoneMessage, setCleanupDoneMessage] = useState<string | null>(null);

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

  const handleCleanUpStorage = () => {
    setStoragePercentage(68.5);
    setCleanupDoneMessage(
      "Purge effectuée : 157.3 Go libérés. Le stockage est repassé sous le seuil critique (68.5%)."
    );
    setShowStorageModal(false);
    setTimeout(() => setCleanupDoneMessage(null), 4500);
  };

  const inboxQuery = useEmailList({ folder: "inbox", page: 1, pageSize: 8, sortBy: "date" });

  const firstName = useMemo(() => {
    const raw = user?.displayName ?? user?.email?.split("@")[0] ?? "Joey";
    return raw.split(/[\s.]/)[0] ?? raw;
  }, [user]);

  const greeting =
    locale === "fr"
      ? `Bonjour ${firstName}. Voici l’état de votre monde ce matin.`
      : `Good morning ${firstName}. Here is your world status for today.`;

  const dateLabel = useMemo(() => {
    if (!now) return "";
    const loc = locale === "fr" ? "fr-FR" : "en-US";
    const date = new Intl.DateTimeFormat(loc, {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    }).format(now).toUpperCase();
    const time = new Intl.DateTimeFormat(loc, { hour: "2-digit", minute: "2-digit" }).format(now);
    return `${date} • ${time}`;
  }, [now, locale]);

  const inboxEmails = useMemo(() => {
    const source = inboxQuery.data?.emails ?? [];
    return source.slice(0, 4).map((e, i) => ({ ...e, score: INBOX_SCORES[i] ?? 80 }));
  }, [inboxQuery.data?.emails]);

  const unreadCountQuery = useEmailList({
    folder: "inbox", filterType: "unread", page: 1, pageSize: 1,
  });

  const unreadCount = unreadCountQuery.data?.total ?? 0;
  const highSignalNewsletters = VEILLE.filter((v) => v.signal >= 80).length;
  const pendingTasks = TASKS.filter((task) => !doneIds.has(task.id)).length;
  const urgentTasks: number = 2;

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
      value: String(ALERTS.length),
      note: t("dashboard.metrics.criticalOne"),
      icon: AlertTriangle,
      tone: "text-amber-400",
    },
  ];

  if (detailItem) {
    return <DetailView item={detailItem} onBack={() => setDetailItem(null)} />;
  }

  return (
    <section className="space-y-5 text-[#E0E0E0]">
      {cleanupDoneMessage && (
        <div className="flex items-center justify-between rounded-xl border border-[#4ADE80]/50 bg-[#0D1A11] px-4 py-3 text-xs text-white shadow-lg">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-[#4ADE80]" />
            <span>{cleanupDoneMessage}</span>
          </div>
          <button type="button" onClick={() => setCleanupDoneMessage(null)}>
            <X className="h-4 w-4 text-[#71717A]" />
          </button>
        </div>
      )}

      <BriefingCard dateLabel={dateLabel} badge={t("dashboard.badge")} greeting={greeting}>
        <MetricsGrid
          metrics={metrics}
          storagePercentage={storagePercentage}
          onOpenStorage={() => setShowStorageModal(true)}
        />
      </BriefingCard>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-4">
        <InboxScoresCard
          emails={inboxEmails}
          onOpen={(email) => setDetailItem({ type: "email", data: email })}
        />
        <VeilleCard onOpen={(article) => setDetailItem({ type: "newsletter", data: article })} />
        <TasksCard
          doneIds={doneIds}
          onToggle={(task) => {
            toggle(task.id);
            setDetailItem({ type: "task", data: task });
          }}
        />
        <AlertsCard onOpen={(alert) => setDetailItem({ type: "alert", data: alert })} />
      </div>

      {showStorageModal && (
        <StorageModal
          percentage={storagePercentage}
          onClose={() => setShowStorageModal(false)}
          onCleanUp={handleCleanUpStorage}
        />
      )}
    </section>
  );
}
