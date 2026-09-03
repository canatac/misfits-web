"use client";

import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { formatTime } from "@/components/dashboard/StorageGauge";
import type { Email } from "@/types/email";
import { NewsletterDetailContent } from "./newsletter-detail-content";
import type {
  DashboardAlertItem,
  DashboardNewsletterItem,
  DashboardTaskItem,
} from "../types";

export type DetailItem =
  | { type: "email"; data: Email & { score: number } }
  | { type: "newsletter"; data: DashboardNewsletterItem }
  | { type: "task"; data: DashboardTaskItem }
  | { type: "alert"; data: DashboardAlertItem };

export function DetailView({ item, onBack }: { item: DetailItem; onBack: () => void }) {
  return (
    <section className="space-y-5 text-[#E0E0E0]">
      <div className="rounded-2xl border border-[#242427] bg-[#121214] p-5 shadow-2xl">
        <div className="mb-5 flex items-center justify-between border-b border-[#242427] pb-4">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-xl border border-[#242427] bg-[#1D1D20] px-3 py-2 text-xs font-semibold text-[#C49B66] transition hover:border-[#C49B66]/50"
          >
            <ArrowLeft className="h-4 w-4" /> Retour au dashboard
          </button>
          <span className="rounded-full border border-[#242427] bg-[#1D1D20] px-2.5 py-1 text-[10px] font-bold text-[#71717A] uppercase">
            {item.type}
          </span>
        </div>

        {item.type === "email" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <p className="text-xs text-[#71717A]">{item.data.from.name}</p>
                <h2 className="text-xl font-bold text-white">{item.data.subject}</h2>
                <p className="text-xs text-[#A1A1AA]">{formatTime(item.data.date)}</p>
              </div>
              <span className="rounded-sm bg-[#C49B66]/15 px-2 py-1 text-xs font-bold text-[#C49B66]">
                Score {item.data.score}
              </span>
            </div>
            <p className="rounded-xl border border-[#242427] bg-[#0A0A0B] p-4 text-sm text-[#D4D4D8]">
              {item.data.preview}
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

        {item.type === "newsletter" && (
          <div className="space-y-4">
            <NewsletterDetailContent item={item.data} />
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

        {item.type === "task" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">{item.data.label}</h2>
            <p className="text-xs text-[#71717A]">Source: {item.data.ref}</p>
            <p className="rounded-xl border border-[#242427] bg-[#0A0A0B] p-4 text-sm text-[#D4D4D8]">
              {item.data.details}
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

        {item.type === "alert" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">{item.data.title}</h2>
            <p className="text-xs text-[#71717A]">Interception: {item.data.time}</p>
            <p className="rounded-xl border border-[#242427] bg-[#0A0A0B] p-4 text-sm text-[#D4D4D8]">
              {item.data.description}
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
