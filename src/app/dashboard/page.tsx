"use client";

import Link from "next/link";
import {
  ArrowRight,
  Mail,
  Newspaper,
  Languages,
  BookOpen,
  Activity,
  ShieldAlert,
} from "lucide-react";

const cards = [
  {
    href: "/mail",
    title: "Focus Inbox",
    description: "Lire, trier et répondre aux mails avec cockpit premium.",
    icon: Mail,
  },
  {
    href: "/newsletters",
    title: "Newsletters Hub",
    description: "Digest IA + filtrage signal/bruit pour veille produit.",
    icon: Newspaper,
  },
  {
    href: "/translation",
    title: "Translation Lab",
    description: "Traduction + nuances culturelles pour communication internationale.",
    icon: Languages,
  },
  {
    href: "/docs",
    title: "User Docs",
    description: "Guides d’usage et bonnes pratiques opératoires.",
    icon: BookOpen,
  },
  {
    href: "/dashboard/monitoring",
    title: "Monitoring SMTP",
    description: "Traçage des flux et KPI délivrabilité.",
    icon: Activity,
  },
  {
    href: "/dashboard/security",
    title: "Security",
    description: "Alertes, incidents et remédiation.",
    icon: ShieldAlert,
  },
];

export default function DashboardIndexPage() {
  return (
    <section className="space-y-4">
      <header className="rounded-2xl border border-[#2A2A2D] bg-[#111113]/90 p-4 text-[#E4E4E7]">
        <div className="mb-2 inline-flex rounded-full border border-[#3A3126] bg-[#1A1611] px-3 py-1 text-xs text-[#E9C995]">
          Morning Journalist Dashboard
        </div>
        <h1 className="text-2xl font-bold">Cockpit Produit</h1>
        <p className="text-sm text-[#A1A1AA]">
          Vue d’ensemble novamail-style: mail core + modules intelligence + ops.
        </p>
      </header>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link
              key={c.href}
              href={c.href}
              className="group rounded-2xl border border-[#242427] bg-[#101012]/95 p-4 text-[#E4E4E7] transition hover:border-[#C49B66]/50 hover:bg-[#151518]"
            >
              <div className="mb-3 inline-flex rounded-lg border border-[#2A2A2D] bg-[#141417] p-2">
                <Icon className="h-4 w-4" />
              </div>
              <h2 className="text-base font-semibold">{c.title}</h2>
              <p className="mt-1 text-sm text-[#A1A1AA]">{c.description}</p>
              <div className="mt-3 inline-flex items-center gap-1 text-xs text-[#E9C995]">
                Ouvrir
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
