"use client";

import { useState, useMemo } from "react";
import { useEmailList } from "@/hooks/use-emails";
import { BarChart3, Download, TrendingUp, Clock, Users, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";

type PeriodFilter = "7d" | "30d" | "90d";

interface StatCard {
  label: string;
  value: string;
  change?: string;
  icon: React.ReactNode;
  color: string;
}

interface DailyActivity {
  date: string;
  sent: number;
  received: number;
}

export function EmailStatistics() {
  const [period, setPeriod] = useState<PeriodFilter>("30d");
  const inboxQuery = useEmailList({ folder: "inbox", page: 1, pageSize: 100, sortBy: "date" });
  const sentQuery = useEmailList({ folder: "sent", page: 1, pageSize: 100, sortBy: "date" });

  const stats = useMemo(() => {
    const inbox = inboxQuery.data?.emails ?? [];
    const sent = sentQuery.data?.emails ?? [];
    const now = new Date();
    const daysBack = period === "7d" ? 7 : period === "30d" ? 30 : 90;
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - daysBack);

    const periodInbox = inbox.filter((e) => new Date(e.date) >= startDate);
    const periodSent = sent.filter((e) => new Date(e.date) >= startDate);

    // Calculate daily activity
    const dailyActivity: DailyActivity[] = [];
    for (let i = daysBack - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      dailyActivity.push({
        date: dateStr,
        sent: periodSent.filter((e) => e.date.startsWith(dateStr)).length,
        received: periodInbox.filter((e) => e.date.startsWith(dateStr)).length,
      });
    }

    // Calculate top recipients
    const recipientCounts: Record<string, number> = {};
    sent.forEach((email) => {
      email.to.forEach((recipient) => {
        const key = recipient.name || recipient.address;
        recipientCounts[key] = (recipientCounts[key] || 0) + 1;
      });
    });
    const topRecipients = Object.entries(recipientCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    // Calculate folder distribution
    const folderCounts: Record<string, number> = { inbox: periodInbox.length, sent: periodSent.length };

    // Calculate average response time (simplified)
    const avgResponseTime = "2.5h"; // Placeholder

    // Peak hours
    const hourCounts: Record<number, number> = {};
    sent.forEach((email) => {
      const hour = new Date(email.date).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    const peakHour = Object.entries(hourCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || "9";

    return {
      totalReceived: periodInbox.length,
      totalSent: periodSent.length,
      avgResponseTime,
      peakHour: `${peakHour}:00`,
      dailyActivity,
      topRecipients,
      folderCounts,
    };
  }, [inboxQuery.data?.emails, sentQuery.data?.emails, period]);

  const handleExportCSV = () => {
    const headers = ["Date", "Sent", "Received"];
    const rows = stats.dailyActivity.map((d) => [d.date, d.sent, d.received]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `email-stats-${period}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const cards: StatCard[] = [
    { label: "Emails reçus", value: String(stats.totalReceived), icon: <TrendingUp className="h-4 w-4" />, color: "#4ADE80" },
    { label: "Emails envoyés", value: String(stats.totalSent), icon: <BarChart3 className="h-4 w-4" />, color: "#38BDF8" },
    { label: "Temps de réponse", value: stats.avgResponseTime, icon: <Clock className="h-4 w-4" />, color: "#C49B66" },
    { label: "Heure de pic", value: stats.peakHour, icon: <Users className="h-4 w-4" />, color: "#FB923C" },
  ];

  return (
    <div className="space-y-6">
      {/* Period filter */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Statistiques d&apos;utilisation</h2>
        <div className="flex items-center gap-2">
          {(["7d", "30d", "90d"] as PeriodFilter[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                period === p
                  ? "bg-[#C49B66] text-white"
                  : "bg-[#1D1D20] border border-[#242427] text-[#71717A] hover:text-white"
              )}
            >
              {p === "7d" ? "7 jours" : p === "30d" ? "30 jours" : "90 jours"}
            </button>
          ))}
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="p-4 rounded-xl border border-[#242427] bg-[#0A0A0B]">
            <div className="flex items-center gap-2 mb-2">
              <div style={{ color: card.color }}>{card.icon}</div>
              <span className="text-xs text-[#71717A]">{card.label}</span>
            </div>
            <span className="text-2xl font-bold text-white">{card.value}</span>
          </div>
        ))}
      </div>

      {/* Activity chart (simplified bar chart) */}
      <div className="p-4 rounded-xl border border-[#242427] bg-[#0A0A0B]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">Activité quotidienne</h3>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-[#C49B66] border border-[#C49B66]/40 hover:bg-[#C49B66]/10 transition-colors"
          >
            <Download className="h-3 w-3" />
            Exporter CSV
          </button>
        </div>
        <div className="flex items-end gap-1 h-32">
          {stats.dailyActivity.slice(-14).map((day) => {
            const maxVal = Math.max(...stats.dailyActivity.map((d) => Math.max(d.sent, d.received)), 1);
            const sentHeight = (day.sent / maxVal) * 100;
            const receivedHeight = (day.received / maxVal) * 100;
            return (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex gap-0.5 items-end h-24">
                  <div
                    className="flex-1 bg-[#C49B66] rounded-t"
                    style={{ height: `${sentHeight}%` }}
                    title={`Envoyés: ${day.sent}`}
                  />
                  <div
                    className="flex-1 bg-[#4ADE80] rounded-t"
                    style={{ height: `${receivedHeight}%` }}
                    title={`Reçus: ${day.received}`}
                  />
                </div>
                <span className="text-[8px] text-[#71717A]">
                  {new Date(day.date).getDate()}
                </span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-4 text-xs text-[#71717A]">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded bg-[#C49B66]" /> Envoyés
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded bg-[#4ADE80]" /> Reçus
          </span>
        </div>
      </div>

      {/* Top recipients and folder distribution */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="p-4 rounded-xl border border-[#242427] bg-[#0A0A0B]">
          <h3 className="text-sm font-semibold text-white mb-4">Top destinataires</h3>
          <div className="space-y-2">
            {stats.topRecipients.length === 0 ? (
              <p className="text-xs text-[#71717A]">Aucune donnée disponible</p>
            ) : (
              stats.topRecipients.map(([name, count], idx) => (
                <div key={name} className="flex items-center justify-between py-2 border-b border-[#242427] last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#71717A]">{idx + 1}.</span>
                    <span className="text-sm text-[#E0E0E0] truncate">{name}</span>
                  </div>
                  <span className="text-xs text-[#C49B66]">{count}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="p-4 rounded-xl border border-[#242427] bg-[#0A0A0B]">
          <h3 className="text-sm font-semibold text-white mb-4">Répartition par dossier</h3>
          <div className="space-y-2">
            {Object.entries(stats.folderCounts).map(([folder, count]) => (
              <div key={folder} className="flex items-center justify-between py-2 border-b border-[#242427] last:border-0">
                <div className="flex items-center gap-2">
                  <FolderOpen className="h-4 w-4 text-[#71717A]" />
                  <span className="text-sm text-[#E0E0E0] capitalize">{folder}</span>
                </div>
                <span className="text-xs text-[#C49B66]">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmailStatistics;
