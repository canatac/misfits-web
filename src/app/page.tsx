import { Activity, Mail } from "lucide-react";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-[var(--color-bg)] p-8">
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[var(--color-brand-500)] shadow-lg">
          <Mail className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-[var(--color-fg)]">
          misfits.ai Mail
        </h1>
        <p className="text-lg text-[var(--color-muted-fg)]">
          IA-first email client — privacy-first, built for speed
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-4">
        <a
          href="/login"
          className="rounded-lg bg-[var(--color-brand-500)] px-6 py-3 font-medium text-white shadow-md transition hover:bg-[var(--color-brand-600)]"
        >
          Sign in
        </a>
        <a
          href="/mail"
          className="rounded-lg border border-[var(--color-border)] px-6 py-3 font-medium text-[var(--color-fg)] transition hover:bg-[var(--color-muted)]"
        >
          View inbox
        </a>
        <a
          href="/dashboard/monitoring"
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-info-300)] bg-[var(--color-info-50)] px-6 py-3 font-medium text-[var(--color-info-800)] transition hover:bg-[var(--color-info-100)]"
        >
          <Activity className="h-4 w-4" />
          Monitoring SMTP
        </a>
      </div>

      <footer className="mt-16 text-sm text-[var(--color-muted-fg)]">
        © 2026 misfits.ai — Powered by Rust + Next.js
      </footer>
    </main>
  );
}
