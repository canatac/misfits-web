"use client";

import Link from "next/link";
import {
  Inbox,
  Newspaper,
  CheckSquare,
  AlertTriangle,
  ArrowUpRight,
  Calendar,
  ShieldAlert,
  Sparkles,
  ChevronRight,
  HardDrive,
} from "lucide-react";
import { useI18n } from "@/i18n/provider";

export default function DashboardIndexPage() {
  const { locale, t } = useI18n();

  const metrics = [
    { label: t("dashboard.metrics.unread"), value: "27", note: t("dashboard.metrics.receivedTonight"), icon: Inbox, tone: "text-[#C49B66]" },
    { label: t("dashboard.metrics.highSignal"), value: "9", note: t("dashboard.metrics.newslettersHighSignal"), icon: Newspaper, tone: "text-[#4ADE80]" },
    { label: t("dashboard.metrics.actions"), value: "6", note: t("dashboard.metrics.urgentCount"), icon: CheckSquare, tone: "text-[#38BDF8]" },
    { label: t("dashboard.metrics.alerts"), value: "2", note: t("dashboard.metrics.criticalOne"), icon: AlertTriangle, tone: "text-amber-400" },
    { label: t("dashboard.metrics.storage"), value: "68.5%", note: t("dashboard.metrics.afterCleanup"), icon: HardDrive, tone: "text-[#C49B66]" },
  ];

  const blocks = [
    {
      title: t("dashboard.blocks.dayMails"),
      icon: Inbox,
      tone: "text-[#C49B66]",
      href: "/mail",
      cta: t("dashboard.blocks.processInbox"),
      items:
        locale === "fr"
          ? [
              "Contrat Q4 à valider avant 14h",
              "Bug report P1 frontend web",
              "Facture fournisseur en attente",
            ]
          : [
              "Q4 contract to validate before 2 PM",
              "P1 bug report on web frontend",
              "Vendor invoice pending",
            ],
    },
    {
      title: t("dashboard.blocks.watch"),
      icon: Newspaper,
      tone: "text-[#4ADE80]",
      href: "/newsletters",
      cta: t("dashboard.blocks.openHub"),
      items:
        locale === "fr"
          ? [
              "LLM open-source: nouvelles sorties",
              "Semi-conducteurs: tendance hebdo",
              "Product-led growth: benchmark SaaS",
            ]
          : [
              "Open-source LLMs: new releases",
              "Semiconductors: weekly trend",
              "Product-led growth: SaaS benchmark",
            ],
    },
    {
      title: t("dashboard.blocks.agenda"),
      icon: Calendar,
      tone: "text-[#38BDF8]",
      href: "/calendar",
      cta: t("dashboard.blocks.openCalendar"),
      items:
        locale === "fr"
          ? ["14:00 — Point Produit", "16:30 — Revue architecture", "Signer accord fournisseur"]
          : ["14:00 — Product sync", "16:30 — Architecture review", "Sign supplier agreement"],
    },
    {
      title: t("dashboard.blocks.ops"),
      icon: ShieldAlert,
      tone: "text-amber-400",
      href: "/dashboard/security",
      cta: t("dashboard.blocks.inspect"),
      items:
        locale === "fr"
          ? ["Tentative phishing bloquée", "Quota IA nominal", "Monitoring SMTP stable"]
          : ["Phishing attempt blocked", "AI quota nominal", "SMTP monitoring stable"],
    },
  ];

  return (
    <section className="space-y-5 text-[#E0E0E0]">
      <header className="relative overflow-hidden rounded-2xl border border-[#242427] bg-gradient-to-r from-[#121214] via-[#161619] to-[#121214] p-6 shadow-2xl">
        <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-[#C49B66]/10 blur-3xl" />
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#3A3126] bg-[#1A1611] px-3 py-1 text-[11px] font-semibold text-[#E9C995]">
            <Sparkles className="h-3.5 w-3.5" />
            {t("dashboard.badge")}
          </div>
          <h1 className="text-2xl font-bold text-white">{t("dashboard.title")}</h1>
          <p className="max-w-4xl text-sm text-[#A1A1AA]">{t("dashboard.subtitle")}</p>
        </div>

        <div className="mt-5 grid gap-2 border-t border-[#242427] pt-4 sm:grid-cols-2 lg:grid-cols-5">
          {metrics.map((m) => {
            const Icon = m.icon;
            return (
              <div key={m.label} className="rounded-xl border border-[#242427] bg-[#1D1D20]/70 p-3">
                <div className="mb-1 flex items-center justify-between text-[11px] text-[#71717A]">
                  <span>{m.label}</span>
                  <Icon className={`h-3.5 w-3.5 ${m.tone}`} />
                </div>
                <div className="text-lg font-bold text-white">{m.value}</div>
                <div className="text-[10px] text-[#71717A]">{m.note}</div>
              </div>
            );
          })}
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        {blocks.map((b) => {
          const Icon = b.icon;
          return (
            <div key={b.title} className="flex flex-col rounded-2xl border border-[#242427] bg-[#121214] p-4 shadow-xl">
              <div className="mb-3 flex items-center justify-between border-b border-[#242427] pb-3">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg border border-[#242427] bg-[#1D1D20] p-1.5">
                    <Icon className={`h-4 w-4 ${b.tone}`} />
                  </div>
                  <h2 className="text-sm font-bold text-white">{b.title}</h2>
                </div>
                <ChevronRight className="h-4 w-4 text-[#71717A]" />
              </div>

              <ul className="flex-1 space-y-2 text-xs text-[#D4D4D8]">
                {b.items.map((item) => (
                  <li key={item} className="rounded-lg border border-[#242427] bg-[#0A0A0B] px-3 py-2">
                    {item}
                  </li>
                ))}
              </ul>

              <Link
                href={b.href}
                className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#242427] bg-[#1D1D20] px-3 py-2 text-xs font-semibold text-white transition hover:border-[#C49B66]/50 hover:bg-[#242427]"
              >
                {b.cta}
                <ArrowUpRight className="h-3.5 w-3.5 text-[#C49B66]" />
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}
