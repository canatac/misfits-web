"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import {
  Inbox,
  Newspaper,
  CheckSquare,
  AlertTriangle,
  Shield,
  Sparkles,
  Calendar,
  ArrowUpRight,
  ChevronRight,
  HardDrive,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/provider";
import { useAuthStore } from "@/stores/auth-store";
import { mockEmails, mockFolders } from "@/lib/mock-emails";

// deterministic scores matching screenshot order for first 4 inbox emails
const INBOX_SCORES = [95, 82, 68, 98] as const;

const BRIEFING = [
  { color: "#4ADE80", category: "Tech & Veille",      text: "Rebond secteur IA & semi-conducteurs d’après vos newsletters sélectionnées à fort signal." },
  { color: "#C49B66", category: "Partenariat",         text: "Validation requise avant 14h pour l’accord Q4 transmis par Sarah Jenkins." },
  { color: "#F87171", category: "Sécurité", text: "Une tentative de phishing a été bloquée ce matin par le bouclier PHAROS." },
  { color: "#38BDF8", category: "Agenda",              text: "2 réunions stratégiques à l’agenda cet après-midi (Point Produit & Architecture)." },
  { color: "#A78BFA", category: "Feuille de route",    text: "4 actions urgentes à traiter pour boucler les livrables de la semaine." },
];

const VEILLE = [
  { id: "v1", title: "The Byte Report", signal: 92, tags: ["#IA", "#MachineLearning"], summary: "Latest issue dives into the new GPT-5 architecture, autonomous agents, and a comparative analysis with leading open-source models." },
  { id: "v2", title: "Market Edge",     signal: 84, tags: ["#Finance", "#Crypto"],     summary: "Analyzes the Federal Reserve recent interest rate decision and its impact on cryptocurrency volatility." },
  { id: "v3", title: "Daily Zen",       signal: 78, tags: ["#Lifestyle", "#Bien-être"], summary: "Explores mindfulness techniques for remote workers, including digital detox strategies and setting healthy boundaries." },
];

const TASKS = [
  { id: "t1", label: "Review Contract (from Joey)", ref: "Email Thread #1" },
  { id: "t2", label: "Follow up with Client X",     ref: "Email Thread #2" },
  { id: "t3", label: "Prepare Presentation",        ref: "Calendar Sync" },
  { id: "t4", label: "Review proposal by EOD",      ref: "Issue Inbox" },
];

const RDV = [
  { id: "r1", title: "Work Team Sync", time: "10 AM" },
  { id: "r2", title: "Project Review", time: "2 PM" },
];

const ALERTS = [
  { id: "a1", title: "Hamçonnage Intercepté (Phishing 99.4%)", time: "08:11 AM", description: "Tentative d’usurpation d’identité bancaire bloquée par le Bouclier PHAROS.", cta: "Inspecter la menace", accent: "#F87171", bg: "bg-[#200F0F]", border: "border-[#3D1515]" },
  { id: "a2", title: "Service Agreement en attente de signature",           time: "Dû 08:15 AM", description: "Contrat Q4 envoyé par Sarah Jenkins. (Délai 30). Démarrage 1er nov.", cta: "Voir le contrat",  accent: "#C49B66", bg: "bg-[#1D1611]", border: "border-[#3A2E1A]" },
  { id: "a3", title: "Quota AI Gemini 1.5 Pro Nominal",                    time: "08:08 AM", description: "4 600 tokens utilisés aujourd’hui sur 100 000 max.", cta: "Consulter la console", accent: "#4ADE80", bg: "bg-[#0D1A11]", border: "border-[#1A3325]" },
];

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export default function DashboardIndexPage() {
  const { locale, t } = useI18n();
  const user = useAuthStore((s) => s.user);

  // hydrate clock client-side to avoid SSR mismatch
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  // t3 pre-checked to match screenshot (Prepare Presentation)
  const [doneIds, setDoneIds] = useState<Set<string>>(() => new Set(["t3"]));
  const toggle = (id: string) =>
    setDoneIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

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
    const date = new Intl.DateTimeFormat(loc, { weekday: "long", day: "numeric", month: "long", year: "numeric" })
      .format(now)
      .toUpperCase();
    const time = new Intl.DateTimeFormat(loc, { hour: "2-digit", minute: "2-digit" }).format(now);
    return `${date} • ${time}`;
  }, [now, locale]);

  const inboxEmails = useMemo(
    () => mockEmails.filter((e) => e.folder === "inbox").slice(0, 4),
    [],
  );

  const unreadCount = mockFolders.find((f) => f.id === "inbox")?.unreadCount ?? 0;

  const metrics = [
    { label: t("dashboard.metrics.unread"),      value: String(unreadCount), note: t("dashboard.metrics.receivedTonight"),        icon: Inbox,         tone: "text-[#C49B66]"   },
    { label: t("dashboard.metrics.highSignal"),  value: "3",                 note: t("dashboard.metrics.newslettersHighSignal"),  icon: Newspaper,     tone: "text-[#4ADE80]"   },
    { label: t("dashboard.metrics.actions"),     value: "5",                 note: t("dashboard.metrics.urgentCount"),            icon: CheckSquare,   tone: "text-[#38BDF8]"   },
    { label: t("dashboard.metrics.alerts"),      value: String(ALERTS.length), note: t("dashboard.metrics.criticalOne"),           icon: AlertTriangle, tone: "text-amber-400"   },
    { label: t("dashboard.metrics.storage"),     value: "84.2%",             note: "842 k/s / 1000 km",  icon: HardDrive,     tone: "text-[#F87171]",  badge: "CRITIQUE" },
  ];

  return (
    <section className="space-y-5 text-[#E0E0E0]">

      {/* greeting + kpis */}
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
                <span className="mt-[5px] h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                <span>
                  <span className="font-semibold" style={{ color: item.color }}>{item.category}{" "}:{" "}</span>
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
                  {m.badge && (
                    <span className="rounded-sm bg-[#F87171]/20 px-1 py-0.5 text-[9px] font-bold uppercase text-[#F87171]">{m.badge}</span>
                  )}
                </div>
                <div className="text-[10px] text-[#71717A]">{m.note}</div>
              </div>
            );
          })}
        </div>
      </header>

      {/* 4-panel grid */}
      <div className="grid gap-4 lg:grid-cols-2">

        {/* mails du jour */}
        <div className="flex flex-col rounded-2xl border border-[#242427] bg-[#121214] shadow-xl">
          <div className="flex items-center justify-between border-b border-[#242427] px-4 py-3">
            <div className="flex items-center gap-2">
              <Inbox className="h-4 w-4 text-[#C49B66]" />
              <h2 className="text-sm font-bold text-white">{t("dashboard.blocks.dayMails")}</h2>
            </div>
            <Link href="/mail" className="flex items-center gap-0.5 text-[11px] font-medium text-[#C49B66] hover:underline">
              Tout voir <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <ul className="flex-1 divide-y divide-[#1A1A1D] px-4">
            {inboxEmails.map((email, i) => (
              <li key={email.id} className="py-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="truncate text-sm font-medium text-[#E4E4E7]">{email.from.name}</span>
                  <span className="shrink-0 font-mono text-[11px] text-[#71717A]">{formatTime(email.date)}</span>
                </div>
                <p className="truncate text-xs font-semibold text-white">{email.subject}</p>
                <p className="line-clamp-1 text-[11px] text-[#A1A1AA]">{email.preview}</p>
                <div className="mt-1.5">
                  <span className="rounded-sm bg-[#C49B66]/15 px-1.5 py-0.5 text-[10px] font-bold text-[#C49B66]">
                    Score {INBOX_SCORES[i]}
                  </span>
                </div>
              </li>
            ))}
          </ul>
          <div className="border-t border-[#242427] px-4 py-3">
            <Link href="/mail" className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#242427] bg-[#1D1D20] px-3 py-2 text-xs font-semibold text-white transition hover:border-[#C49B66]/50 hover:bg-[#242427]">
              {t("dashboard.blocks.processInbox")} <ArrowUpRight className="h-3.5 w-3.5 text-[#C49B66]" />
            </Link>
          </div>
        </div>

        {/* veille & presse */}
        <div className="flex flex-col rounded-2xl border border-[#242427] bg-[#121214] shadow-xl">
          <div className="flex items-center justify-between border-b border-[#242427] px-4 py-3">
            <div className="flex items-center gap-2">
              <Newspaper className="h-4 w-4 text-[#4ADE80]" />
              <h2 className="text-sm font-bold text-white">{t("dashboard.blocks.watch")}</h2>
            </div>
            <Link href="/newsletters" className="flex items-center gap-0.5 text-[11px] font-medium text-[#4ADE80] hover:underline">
              Consulter le Hub <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <ul className="flex-1 divide-y divide-[#1A1A1D] px-4">
            {VEILLE.map((article) => (
              <li key={article.id} className="py-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-semibold text-sm text-white">{article.title}</span>
                  <span className="shrink-0 rounded-sm bg-[#4ADE80]/15 px-1.5 py-0.5 text-[10px] font-bold text-[#4ADE80]">
                    Signal {article.signal}%
                  </span>
                </div>
                <p className="mt-0.5 line-clamp-2 text-[11px] text-[#A1A1AA]">{article.summary}</p>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {article.tags.map((tag) => (
                    <span key={tag} className="rounded-sm bg-[#1D1D20] px-1.5 py-0.5 text-[10px] text-[#71717A]">{tag}</span>
                  ))}
                </div>
              </li>
            ))}
          </ul>
          <div className="border-t border-[#242427] px-4 py-3">
            <Link href="/newsletters" className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#242427] bg-[#1D1D20] px-3 py-2 text-xs font-semibold text-white transition hover:border-[#4ADE80]/50 hover:bg-[#242427]">
              {t("dashboard.blocks.openHub")} <ArrowUpRight className="h-3.5 w-3.5 text-[#4ADE80]" />
            </Link>
          </div>
        </div>

        {/* actions a realiser */}
        <div className="flex flex-col rounded-2xl border border-[#242427] bg-[#121214] shadow-xl">
          <div className="flex items-center justify-between border-b border-[#242427] px-4 py-3">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-[#38BDF8]" />
              <h2 className="text-sm font-bold text-white">{t("dashboard.blocks.agenda")}</h2>
            </div>
            <Link href="/calendar" className="flex items-center gap-0.5 text-[11px] font-medium text-[#38BDF8] hover:underline">
              Calendrier <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="flex-1 px-4 py-3">
            <ul className="space-y-1">
              {TASKS.map((task) => {
                const done = doneIds.has(task.id);
                return (
                  <li key={task.id}>
                    <button
                      type="button"
                      onClick={() => toggle(task.id)}
                      className="flex w-full items-start gap-2.5 rounded-lg px-2 py-1.5 text-left transition hover:bg-[#1D1D20]"
                    >
                      <span className={cn("mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition", done ? "border-[#38BDF8] bg-[#38BDF8]" : "border-[#3A3A3F]")}>
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
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[#52525B]">
                Rendez-vous aujourd’hui
              </p>
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
            <Link href="/calendar" className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#242427] bg-[#1D1D20] px-3 py-2 text-xs font-semibold text-white transition hover:border-[#38BDF8]/50 hover:bg-[#242427]">
              {t("dashboard.blocks.openCalendar")} <ArrowUpRight className="h-3.5 w-3.5 text-[#38BDF8]" />
            </Link>
          </div>
        </div>

        {/* alertes & signaux */}
        <div className="flex flex-col rounded-2xl border border-[#242427] bg-[#121214] shadow-xl">
          <div className="flex items-center justify-between border-b border-[#242427] px-4 py-3">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-amber-400" />
              <h2 className="text-sm font-bold text-white">{t("dashboard.blocks.ops")}</h2>
            </div>
            <span className="rounded-sm bg-amber-400/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-400">
              {ALERTS.length} Actives
            </span>
          </div>
          <ul className="flex-1 space-y-2 px-4 py-3">
            {ALERTS.map((alert) => (
              <li key={alert.id} className={cn("rounded-xl border p-3", alert.bg, alert.border)}>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-bold leading-tight" style={{ color: alert.accent }}>{alert.title}</span>
                  <span className="shrink-0 font-mono text-[10px] text-[#71717A]">{alert.time}</span>
                </div>
                <p className="mt-1 text-[11px] text-[#A1A1AA]">{alert.description}</p>
                <button type="button" className="mt-1.5 text-[11px] font-medium hover:underline" style={{ color: alert.accent }}>
                  {alert.cta} ↗
                </button>
              </li>
            ))}
          </ul>
          <div className="border-t border-[#242427] px-4 py-3">
            <p className="text-center text-[10px] text-[#3F3F46]">Système autonome sous surveillance continue.</p>
          </div>
        </div>

      </div>
    </section>
  );
}
