import Link from "next/link";
import {
  Activity,
  ArrowRight,
  ClipboardList,
  History,
  Settings2,
  ShieldAlert,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const items = [
  {
    href: "/settings/ai",
    title: "Settings",
    description: "Configuration IA, modèles et comportements.",
    icon: Settings2,
  },
  {
    href: "/dashboard/security",
    title: "Security",
    description: "Incidents, risques et posture de sécurité.",
    icon: ShieldAlert,
  },
  {
    href: "/dashboard/monitoring",
    title: "Monitoring",
    description: "Santé SMTP/IMAP/API et métriques live.",
    icon: Activity,
  },
  {
    href: "/admin/changelog",
    title: "Changelog",
    description: "Historique des changements (commits, auteurs, workflows).",
    icon: History,
  },
  {
    href: "/admin/change-requests",
    title: "Change Requests",
    description: "Plan, tâches et demandes admin à exécuter par l'IA.",
    icon: ClipboardList,
  },
];

export default function AdminHomePage() {
  return (
    <section className="space-y-4">
      <header className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-card)] p-4">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-muted)] px-3 py-1 text-xs">
          <Wrench className="h-3.5 w-3.5" />
          Admin Space
        </div>
        <h1 className="text-2xl font-bold">Admin</h1>
        <p className="text-sm text-[var(--color-muted-fg)]">
          Espace séparé du chat mail pour pilotage produit, sécurité et opérations.
        </p>
      </header>

      <div className="grid gap-3 md:grid-cols-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <article
              key={item.href}
              className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-4"
            >
              <div className="mb-3 inline-flex rounded-md border border-[var(--color-border)] p-2">
                <Icon className="h-4 w-4" />
              </div>
              <h2 className="text-base font-semibold">{item.title}</h2>
              <p className="mt-1 text-sm text-[var(--color-muted-fg)]">{item.description}</p>
              <div className="mt-3">
                <Button asChild variant="outline" size="sm">
                  <Link href={item.href}>
                    Ouvrir
                    <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
