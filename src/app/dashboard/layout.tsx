import { AppSwitcher } from "@/components/navigation/app-switcher";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <AppSwitcher />
      <main className="mx-auto w-full max-w-[1500px] space-y-4 p-4 md:p-6">
        <header className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-card)] p-4">
          <h1 className="text-2xl font-bold">Ops Dashboard</h1>
          <p className="text-sm text-[var(--color-muted-fg)]">Monitoring SMTP + posture securite temps reel.</p>
        </header>
        {children}
      </main>
    </div>
  );
}
