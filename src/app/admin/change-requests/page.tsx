import Link from "next/link";
import { ArrowRight, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminChangeRequestsPlaceholderPage() {
  return (
    <section className="space-y-4">
      <header className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-card)] p-4">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-muted)] px-3 py-1 text-xs">
          <ClipboardList className="h-3.5 w-3.5" />
          Change Requests
        </div>
        <h1 className="text-2xl font-bold">Change Requests Admin</h1>
        <p className="text-sm text-[var(--color-muted-fg)]">
          Formulaire d’exécution IA dédié admin. Livré dans la PR C.
        </p>
      </header>

      <Button asChild variant="outline">
        <Link href="/admin">
          Retour Admin
          <ArrowRight className="ml-1 h-3.5 w-3.5" />
        </Link>
      </Button>
    </section>
  );
}
