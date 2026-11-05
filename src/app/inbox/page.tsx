"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

/**
 * Inbox redirect — /inbox is an alias for /mail.
 *
 * States:
 * - loading: redirect in progress (spinner + status text for screen readers)
 * - error: navigation failed, user can retry or open /mail manually
 */
export default function InboxPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      router.replace("/mail");
    } catch {
      // The navigation error is surfaced on the next tick so the loading
      // state is painted first and the error state is a real transition.
      const handle = setTimeout(() => {
        setError("We could not open your inbox. Please try again.");
      }, 0);
      return () => clearTimeout(handle);
    }
  }, [router]);

  if (error) {
    return (
      <main
        className="flex h-full flex-col items-center justify-center gap-4 bg-[var(--color-bg)] px-6 text-center"
        data-testid="inbox-error"
      >
        <p className="text-sm text-[var(--color-fg)]" role="alert">
          {error}
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setError(null);
              router.replace("/mail");
            }}
            className="rounded-md bg-[var(--color-brand-500)] px-4 py-2 text-sm font-medium text-[var(--color-bg)] transition-colors hover:bg-[var(--color-brand-400)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00D400]"
          >
            Retry
          </button>
          <Link
            href="/mail"
            className="rounded-md border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-fg)] transition-colors hover:bg-[var(--color-muted)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00D400]"
          >
            Open inbox
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main
      className="flex h-full flex-col items-center justify-center gap-3 bg-[var(--color-bg)]"
      data-testid="inbox-loading"
    >
      <span
        className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-brand-500)]"
        aria-hidden="true"
      />
      <p className="text-sm text-[var(--color-muted-fg)]" role="status">
        Opening your inbox…
      </p>
    </main>
  );
}
