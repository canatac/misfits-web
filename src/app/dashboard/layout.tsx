import Link from "next/link";
import { Activity, ShieldAlert } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-[1500px] space-y-4 p-4 md:p-6">
      <header className="space-y-3 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-card)] p-4">
        <div>
          <h1 className="text-2xl font-bold">Ops Dashboard</h1>
          <p className="text-sm text-[var(--color-muted-fg)]">Monitoring SMTP + posture securite temps reel.</p>
        </div>

        <nav className="flex flex-wrap gap-2">
          <Link
            href="/dashboard/monitoring"
            className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2 text-sm hover:bg-[var(--color-muted)]"
          >
            <Activity className="h-4 w-4" /> Monitoring
          </Link>
          <Link
            href="/dashboard/security"
            className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2 text-sm hover:bg-[var(--color-muted)]"
          >
            <ShieldAlert className="h-4 w-4" /> Security
          </Link>
        </nav>
      </header>
      {children}
    </main>
  );
}
