"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  Calendar,
  Check,
  CheckSquare,
  ChevronRight,
  ExternalLink,
  HardDrive,
  Inbox,
  Newspaper,
  RefreshCw,
  Shield,
  Sparkles,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/provider";
import { useAuthStore } from "@/stores/auth-store";
import { mockEmails, mockFolders } from "@/lib/mock-emails";
import { useEmailList } from "@/hooks/use-emails";

const INBOX_SCORES = [95, 82, 68, 98] as const;

const BRIEFING = [
  {
    color: "#4ADE80",
    category: "Tech & Veille",
    text: "Rebond secteur IA & semi-conducteurs d’après vos newsletters sélectionnées à fort signal.",
  },
  {
    color: "#C49B66",
    category: "Partenariat",
    text: "Validation requise avant 14h pour l’accord Q4 transmis par Sarah Jenkins.",
  },
  {
    color: "#F87171",
    category: "Sécurité",
    text: "Une tentative de phishing a été bloquée ce matin par le bouclier PHAROS.",
  },
  {
    color: "#38BDF8",
    category: "Agenda",
    text: "2 réunions stratégiques à l’agenda cet après-midi (Point Produit & Architecture).",
  },
  {
    color: "#A78BFA",
    category: "Feuille de route",
    text: "4 actions urgentes à traiter pour boucler les livrables de la semaine.",
  },
] as const;

const VEILLE = [
  {
    id: "v1",
    title: "The Byte Report",
    signal: 92,
    tags: ["#IA", "#MachineLearning"],
    summary:
      "Latest issue dives into the new GPT-5 architecture, autonomous agents, and a comparative analysis with leading open-source models.",
    takeaways: [
      "GPT-5 introduces stronger tool routing and memory handling.",
      "Agentic workflows are moving from demos to production guardrails.",
      "Open-source models close latency/cost gaps on constrained tasks.",
    ],
  },
  {
    id: "v2",
    title: "Market Edge",
    signal: 84,
    tags: ["#Finance", "#Crypto"],
    summary:
      "Analyzes the Federal Reserve recent interest rate decision and its impact on cryptocurrency volatility.",
    takeaways: [
      "Rate decision increased short-term risk appetite.",
      "BTC volatility rises during macro-news windows.",
      "Hedging narratives dominate institutional commentary.",
    ],
  },
  {
    id: "v3",
    title: "Daily Zen",
    signal: 78,
    tags: ["#Lifestyle", "#Bien-être"],
    summary:
      "Explores mindfulness techniques for remote workers, including digital detox strategies and setting healthy boundaries.",
    takeaways: [
      "Short deep-work blocks outperform long distracted sessions.",
      "Calendar hygiene is a major stress reducer.",
      "Small offline rituals improve focus recovery.",
    ],
  },
] as const;

const TASKS = [
  {
    id: "t1",
    label: "Review Contract (from Joey)",
    ref: "Email Thread #1",
    details:
      "Contract Q4 includes revised payment terms and SLA penalties. Validation required before 14:00.",
  },
  {
    id: "t2",
    label: "Follow up with Client X",
    ref: "Email Thread #2",
    details:
      "Client asks for migration timeline and security hardening milestones for September.",
  },
  {
    id: "t3",
    label: "Prepare Presentation",
    ref: "Calendar Sync",
    details:
      "Finalize product narrative and benchmark slides for architecture review.",
  },
  {
    id: "t4",
    label: "Review proposal by EOD",
    ref: "Issue Inbox",
    details:
      "Proposal impacts infra costs and requires product + engineering sign-off.",
  },
] as const;

const RDV = [
  { id: "r1", title: "Work Team Sync", time: "10:00" },
  { id: "r2", title: "Project Review", time: "14:00" },
] as const;

const ALERTS = [
  {
    id: "a1",
    title: "Hameçonnage Intercepté (Phishing 99.4%)",
    time: "08:11 AM",
    description:
      "Tentative d’usurpation d’identité bancaire bloquée par le Bouclier PHAROS.",
    cta: "Inspecter la menace",
    accent: "#F87171",
    bg: "bg-[#200F0F]",
    border: "border-[#3D1515]",
  },
  {
    id: "a2",
    title: "Service Agreement en attente de signature",
    time: "Dû 08:15 AM",
    description:
      "Contrat Q4 envoyé par Sarah Jenkins. (Délai 30). Démarrage 1er nov.",
    cta: "Voir le contrat",
    accent: "#C49B66",
    bg: "bg-[#1D1611]",
    border: "border-[#3A2E1A]",
  },
  {
    id: "a3",
    title: "Quota AI Gemini 1.5 Pro Nominal",
    time: "08:08 AM",
    description: "4 600 tokens utilisés aujourd’hui sur 100 000 max.",
    cta: "Consulter la console",
    accent: "#4ADE80",
    bg: "bg-[#0D1A11]",
    border: "border-[#1A3325]",
  },
] as const;

type DetailItem =
  | { type: "email"; data: (typeof mockEmails)[number] & { score: number } }
  | { type: "newsletter"; data: (typeof VEILLE)[number] }
  | { type: "task"; data: (typeof TASKS)[number] }
  | { type: "alert"; data: (typeof ALERTS)[number] };

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StorageGauge({
  percentage,
  compact,
}: {
  percentage: number;
  compact?: boolean;
}) {
  const radius = compact ? 26 : 36;
  const stroke = compact ? 5 : 7;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const clamped = Math.max(0, Math.min(100, percentage));
  const offset = circumference - (clamped / 100) * circumference;
  const isCritical = clamped >= 80;

  return (
    <div className={cn("flex items-center", compact ? "gap-2" : "gap-3")}>
      <div className="relative">
        <svg width={radius * 2} height={radius * 2}>
          <circle
            stroke="#2A2A2E"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <circle
            stroke={isCritical ? "#F87171" : "#4ADE80"}
            fill="transparent"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            style={{ strokeDashoffset: offset, transition: "stroke-dashoffset 300ms" }}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            transform={`rotate(-90 ${radius} ${radius})`}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">
          {clamped}%
        </span>
      </div>
      {!compact && (
        <div className="space-y-0.5 text-xs">
          <p className="text-white">Stockage cloud</p>
          <p className="text-[#71717A]">842 Go / 1000 Go</p>
        </div>
      )}
    </div>
  );
}

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
      "Purge effectuée : 157.3 Go libérés. Le stockage est repassé sous le seuil critique (68.5%).",
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
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    })
      .format(now)
      .toUpperCase();
    const time = new Intl.DateTimeFormat(loc, {
      hour: "2-digit",
      minute: "2-digit",
    }).format(now);
    return `${date} • ${time}`;
  }, [now, locale]);

  const inboxEmails = useMemo(() => {
    const source =
      inboxQuery.data?.emails && inboxQuery.data.emails.length > 0
        ? inboxQuery.data.emails
        : mockEmails.filter((e) => e.folder === "inbox");

    return source.slice(0, 4).map((e, i) => ({ ...e, score: INBOX_SCORES[i] ?? 80 }));
  }, [inboxQuery.data?.emails]);

  const unreadCountQuery = useEmailList({
    folder: "inbox",
    filterType: "unread",
    page: 1,
    pageSize: 1,
  });

  const unreadCount =
    unreadCountQuery.data?.total ??
    (mockFolders.find((f) => f.id === "inbox")?.unreadCount ?? 0);
  const highSignalNewsletters = VEILLE.filter((v) => v.signal >= 80).length;
  const pendingTasks = TASKS.filter((task) => !doneIds.has(task.id)).length;
  const urgentTasks = 2;

  const metrics = [
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
    return (
      <section className="space-y-5 text-[#E0E0E0]">
        <div className="rounded-2xl border border-[#242427] bg-[#121214] p-5 shadow-2xl">
          <div className="mb-5 flex items-center justify-between border-b border-[#242427] pb-4">
            <button
              type="button"
              onClick={() => setDetailItem(null)}
              className="inline-flex items-center gap-2 rounded-xl border border-[#242427] bg-[#1D1D20] px-3 py-2 text-xs font-semibold text-[#C49B66] transition hover:border-[#C49B66]/50"
            >
              <ArrowLeft className="h-4 w-4" /> Retour au dashboard
            </button>
            <span className="rounded-full border border-[#242427] bg-[#1D1D20] px-2.5 py-1 text-[10px] font-bold uppercase text-[#71717A]">
              {detailItem.type}
            </span>
          </div>

          {detailItem.type === "email" && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-xs text-[#71717A]">{detailItem.data.from.name}</p>
                  <h2 className="text-xl font-bold text-white">{detailItem.data.subject}</h2>
                  <p className="text-xs text-[#A1A1AA]">{formatTime(detailItem.data.date)}</p>
                </div>
                <span className="rounded-sm bg-[#C49B66]/15 px-2 py-1 text-xs font-bold text-[#C49B66]">
                  Score {detailItem.data.score}
                </span>
              </div>
              <p className="rounded-xl border border-[#242427] bg-[#0A0A0B] p-4 text-sm text-[#D4D4D8]">
                {detailItem.data.preview}
              </p>
              <div className="flex justify-end">
                <Link
                  href="/mail"
                  className="inline-flex items-center gap-1 rounded-xl border border-[#242427] bg-[#1D1D20] px-3 py-2 text-xs font-semibold text-white transition hover:border-[#C49B66]/50"
                >
                  Ouvrir dans l’inbox <ExternalLink className="h-3.5 w-3.5 text-[#C49B66]" />
                </Link>
              </div>
            </div>
          )}

          {detailItem.type === "newsletter" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">{detailItem.data.title}</h2>
                <span className="rounded-sm bg-[#4ADE80]/15 px-2 py-1 text-xs font-bold text-[#4ADE80]">
                  Signal {detailItem.data.signal}%
                </span>
              </div>
              <p className="text-sm text-[#D4D4D8]">{detailItem.data.summary}</p>
              <ul className="space-y-1 rounded-xl border border-[#242427] bg-[#0A0A0B] p-4 text-sm text-[#A1A1AA]">
                {detailItem.data.takeaways.map((takeaway) => (
                  <li key={takeaway} className="flex gap-2">
                    <span className="text-[#4ADE80]">•</span>
                    <span>{takeaway}</span>
                  </li>
                ))}
              </ul>
              <div className="flex justify-end">
                <Link
                  href="/newsletters"
                  className="inline-flex items-center gap-1 rounded-xl border border-[#242427] bg-[#1D1D20] px-3 py-2 text-xs font-semibold text-white transition hover:border-[#4ADE80]/50"
                >
                  Ouvrir le hub <ExternalLink className="h-3.5 w-3.5 text-[#4ADE80]" />
                </Link>
              </div>
            </div>
          )}

          {detailItem.type === "task" && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white">{detailItem.data.label}</h2>
              <p className="text-xs text-[#71717A]">Source: {detailItem.data.ref}</p>
              <p className="rounded-xl border border-[#242427] bg-[#0A0A0B] p-4 text-sm text-[#D4D4D8]">
                {detailItem.data.details}
              </p>
              <div className="flex justify-end">
                <Link
                  href="/calendar"
                  className="inline-flex items-center gap-1 rounded-xl border border-[#242427] bg-[#1D1D20] px-3 py-2 text-xs font-semibold text-white transition hover:border-[#38BDF8]/50"
                >
                  Voir calendrier <ExternalLink className="h-3.5 w-3.5 text-[#38BDF8]" />
                </Link>
              </div>
            </div>
          )}

          {detailItem.type === "alert" && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white">{detailItem.data.title}</h2>
              <p className="text-xs text-[#71717A]">Interception: {detailItem.data.time}</p>
              <p className="rounded-xl border border-[#242427] bg-[#0A0A0B] p-4 text-sm text-[#D4D4D8]">
                {detailItem.data.description}
              </p>
              <div className="flex justify-end">
                <Link
                  href="/mail"
                  className="inline-flex items-center gap-1 rounded-xl border border-[#242427] bg-[#1D1D20] px-3 py-2 text-xs font-semibold text-white transition hover:border-[#F87171]/50"
                >
                  Gérer incident <ExternalLink className="h-3.5 w-3.5 text-[#F87171]" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    );
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

      <header className="relative overflow-hidden rounded-2xl border border-[#242427] bg-gradient-to-r from-[#121214] via-[#161619] to-[#121214] p-6 shadow-2xl">
        <div className="pointer-events-none absolute right-0 top-0 h-72 w-72 rounded-full bg-[#C49B66]/10 blur-3xl" />
        <div className="relative z-10 space-y-3">
          {dateLabel && (
            <p className="font-mono text-[11px] font-semibold tracking-widest text-[#C49B66]">{dateLabel}</p>
          )}
          <div className="inline-flex items-center gap-2 rounded-full border border-[#3A3126] bg-[#1A1611] px-3 py-1 text-[11px] font-semibold text-[#E9C995]">
            <Sparkles className="h-3.5 w-3.5" />
            {t("dashboard.badge")}
          </div>
          <h1 className="text-2xl font-bold text-white">{greeting}</h1>
          <ul className="space-y-1 pt-1">
            {BRIEFING.map((item) => (
              <li key={item.category} className="flex items-start gap-2 text-sm">
                <span
                  className="mt-[5px] h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span>
                  <span className="font-semibold" style={{ color: item.color }}>
                    {item.category}{" "}:
                  </span>{" "}
                  <span className="text-[#D4D4D8]">{item.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-5 grid gap-2 border-t border-[#242427] pt-4 sm:grid-cols-2 lg:grid-cols-5">
          {metrics.map((m) => {
            const Icon = m.icon;
            return (
              <div key={m.label} className="rounded-xl border border-[#242427] bg-[#1D1D20]/70 p-3">
                <div className="mb-1 flex items-center justify-between text-[11px] text-[#71717A]">
                  <span>{m.label}</span>
                  <Icon className={cn("h-3.5 w-3.5", m.tone)} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-white">{m.value}</span>
                </div>
                <div className="text-[10px] text-[#71717A]">{m.note}</div>
              </div>
            );
          })}

          <button
            type="button"
            onClick={() => setShowStorageModal(true)}
            className="rounded-xl border border-[#242427] bg-[#1D1D20]/70 p-3 text-left transition hover:border-[#F87171]/40"
          >
            <div className="mb-1 flex items-center justify-between text-[11px] text-[#71717A]">
              <span className="inline-flex items-center gap-1">
                <HardDrive className="h-3.5 w-3.5 text-[#F87171]" /> Stockage
              </span>
              {storagePercentage >= 80 && (
                <span className="rounded-sm bg-[#F87171]/20 px-1 py-0.5 text-[9px] font-bold uppercase text-[#F87171]">
                  Critique
                </span>
              )}
            </div>
            <StorageGauge percentage={storagePercentage} compact />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-4">
        <div className="flex flex-col rounded-2xl border border-[#242427] bg-[#121214] shadow-xl">
          <div className="flex items-center justify-between border-b border-[#242427] px-4 py-3">
            <div className="flex items-center gap-2">
              <Inbox className="h-4 w-4 text-[#C49B66]" />
              <h2 className="text-sm font-bold text-white">Mails du Jour</h2>
            </div>
            <button
              type="button"
              onClick={() => setDetailItem({ type: "email", data: inboxEmails[0] })}
              className="flex items-center gap-0.5 text-[11px] font-medium text-[#C49B66] hover:underline"
            >
              Tout voir <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          <ul className="flex-1 space-y-2 px-4 py-3">
            {inboxEmails.map((email) => (
              <li key={email.id}>
                <button
                  type="button"
                  onClick={() => setDetailItem({ type: "email", data: email })}
                  className="w-full rounded-xl border border-[#242427] bg-[#0A0A0B] p-3 text-left transition hover:border-[#C49B66]/60"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="truncate text-sm font-medium text-[#E4E4E7]">{email.from.name}</span>
                    <span className="shrink-0 font-mono text-[11px] text-[#71717A]">{formatTime(email.date)}</span>
                  </div>
                  <p className="truncate text-xs font-semibold text-white">{email.subject}</p>
                  <p className="line-clamp-2 text-[11px] text-[#A1A1AA]">{email.preview}</p>
                  <div className="mt-1.5">
                    <span className="rounded-sm bg-[#C49B66]/15 px-1.5 py-0.5 text-[10px] font-bold text-[#C49B66]">
                      Score {email.score}
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
          <div className="border-t border-[#242427] px-4 py-3">
            <Link
              href="/mail"
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#242427] bg-[#1D1D20] px-3 py-2 text-xs font-semibold text-white transition hover:border-[#C49B66]/50 hover:bg-[#242427]"
            >
              Traiter dans l’inbox <ArrowUpRight className="h-3.5 w-3.5 text-[#C49B66]" />
            </Link>
          </div>
        </div>

        <div className="flex flex-col rounded-2xl border border-[#242427] bg-[#121214] shadow-xl">
          <div className="flex items-center justify-between border-b border-[#242427] px-4 py-3">
            <div className="flex items-center gap-2">
              <Newspaper className="h-4 w-4 text-[#4ADE80]" />
              <h2 className="text-sm font-bold text-white">Veille & Presse</h2>
            </div>
            <Link href="/newsletters" className="flex items-center gap-0.5 text-[11px] font-medium text-[#4ADE80] hover:underline">
              Consulter le Hub <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <ul className="flex-1 space-y-2 px-4 py-3">
            {VEILLE.map((article) => (
              <li key={article.id}>
                <button
                  type="button"
                  onClick={() => setDetailItem({ type: "newsletter", data: article })}
                  className="w-full rounded-xl border border-[#242427] bg-[#0A0A0B] p-3 text-left transition hover:border-[#4ADE80]/60"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-semibold text-white">{article.title}</span>
                    <span className="shrink-0 rounded-sm bg-[#4ADE80]/15 px-1.5 py-0.5 text-[10px] font-bold text-[#4ADE80]">
                      Signal {article.signal}%
                    </span>
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-[11px] text-[#A1A1AA]">{article.summary}</p>
                </button>
              </li>
            ))}
          </ul>
          <div className="border-t border-[#242427] px-4 py-3">
            <Link
              href="/newsletters"
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#242427] bg-[#1D1D20] px-3 py-2 text-xs font-semibold text-white transition hover:border-[#4ADE80]/50 hover:bg-[#242427]"
            >
              Ouvrir le hub <ArrowUpRight className="h-3.5 w-3.5 text-[#4ADE80]" />
            </Link>
          </div>
        </div>

        <div className="flex flex-col rounded-2xl border border-[#242427] bg-[#121214] shadow-xl">
          <div className="flex items-center justify-between border-b border-[#242427] px-4 py-3">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-[#38BDF8]" />
              <h2 className="text-sm font-bold text-white">Actions & Agenda</h2>
            </div>
            <Link href="/calendar" className="flex items-center gap-0.5 text-[11px] font-medium text-[#38BDF8] hover:underline">
              Calendrier <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="flex-1 px-4 py-3">
            <ul className="space-y-1.5">
              {TASKS.map((task) => {
                const done = doneIds.has(task.id);
                return (
                  <li key={task.id}>
                    <button
                      type="button"
                      onClick={() => {
                        toggle(task.id);
                        setDetailItem({ type: "task", data: task });
                      }}
                      className="flex w-full items-start gap-2.5 rounded-lg border border-transparent px-2 py-1.5 text-left transition hover:border-[#242427] hover:bg-[#1D1D20]"
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition",
                          done ? "border-[#38BDF8] bg-[#38BDF8]" : "border-[#3A3A3F]",
                        )}
                      >
                        {done && <span className="h-2 w-2 rounded-sm bg-[#121214]" />}
                      </span>
                      <div className="min-w-0">
                        <p className={cn("truncate text-xs font-medium", done ? "text-[#52525B] line-through" : "text-[#D4D4D8]")}>{task.label}</p>
                        <p className="text-[10px] text-[#3F3F46]">{task.ref}</p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="mt-4">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[#52525B]">Rendez-vous aujourd’hui</p>
              <ul className="space-y-1.5">
                {RDV.map((r) => (
                  <li key={r.id} className="flex items-center justify-between rounded-lg bg-[#1D1D20] px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-[#38BDF8]" />
                      <span className="text-xs font-medium text-[#E4E4E7]">{r.title}</span>
                    </div>
                    <span className="font-mono text-[11px] text-[#38BDF8]">{r.time}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-[#242427] px-4 py-3">
            <Link
              href="/calendar"
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#242427] bg-[#1D1D20] px-3 py-2 text-xs font-semibold text-white transition hover:border-[#38BDF8]/50 hover:bg-[#242427]"
            >
              Ouvrir calendrier <ArrowUpRight className="h-3.5 w-3.5 text-[#38BDF8]" />
            </Link>
          </div>
        </div>

        <div className="flex flex-col rounded-2xl border border-[#242427] bg-[#121214] shadow-xl">
          <div className="flex items-center justify-between border-b border-[#242427] px-4 py-3">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-amber-400" />
              <h2 className="text-sm font-bold text-white">Ops & Alertes</h2>
            </div>
            <span className="rounded-sm bg-amber-400/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-400">
              {ALERTS.length} actives
            </span>
          </div>
          <ul className="flex-1 space-y-2 px-4 py-3">
            {ALERTS.map((alert) => (
              <li key={alert.id}>
                <button
                  type="button"
                  onClick={() => setDetailItem({ type: "alert", data: alert })}
                  className={cn("w-full rounded-xl border p-3 text-left transition hover:opacity-90", alert.bg, alert.border)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold leading-tight" style={{ color: alert.accent }}>
                      {alert.title}
                    </span>
                    <span className="shrink-0 font-mono text-[10px] text-[#71717A]">{alert.time}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-[#A1A1AA]">{alert.description}</p>
                  <p className="mt-1.5 text-[11px] font-medium" style={{ color: alert.accent }}>
                    {alert.cta} ↗
                  </p>
                </button>
              </li>
            ))}
          </ul>
          <div className="border-t border-[#242427] px-4 py-3">
            <p className="text-center text-[10px] text-[#3F3F46]">Système autonome sous surveillance continue.</p>
          </div>
        </div>
      </div>

      {showStorageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="storage-modal-title"
            className="w-full max-w-lg rounded-2xl border border-[#242427] bg-[#121214] p-5 shadow-2xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 id="storage-modal-title" className="text-base font-bold text-white">StorageGauge — Nettoyage</h3>
                <X className="h-4 w-4 text-[#71717A]" />
              </button>
            </div>

            <div className="mb-4 rounded-xl border border-[#242427] bg-[#0A0A0B] p-4">
              <StorageGauge percentage={storagePercentage} />
              <div className="mt-3 space-y-1 text-xs text-[#A1A1AA]">
                <p>Utilisé: 842 Go</p>
                <p>Disponible: 158 Go</p>
                <p>Capacité totale: 1000 Go</p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-[#71717A]">Mode critique au-dessus de 80%. Purge recommandée.</p>
              <button
                type="button"
                onClick={handleCleanUpStorage}
                className="inline-flex items-center gap-1 rounded-xl border border-[#F87171]/40 bg-[#2A1515] px-3 py-2 text-xs font-semibold text-[#F87171] transition hover:bg-[#341919]"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Purger l’espace
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
