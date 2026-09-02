"use client";

import { NewsletterHubHeader } from "./newsletter-hub-parts/newsletter-hub-header";
import { SourceManagerCard } from "./newsletter-hub-parts/source-manager-card";
import { SummaryControls } from "./newsletter-hub-parts/summary-controls";
import { SummaryList } from "./newsletter-hub-parts/summary-list";
import { useNewsletterHubState } from "./newsletter-hub-parts/use-newsletter-hub-state";

export function NewsletterHub() {
  const state = useNewsletterHubState();

  return (
    <section className="h-full overflow-auto p-4 text-[#E4E4E7] md:p-6">
      <NewsletterHubHeader />

      <div className="mb-2 text-xs text-[#A1A1AA]">
        Sources actives: {state.sources.length} · Résumés: {state.items.length}
      </div>

      {state.notice && <div className="mb-4 text-xs text-[#E9C995]">{state.notice}</div>}

      <SourceManagerCard state={state} />
      <SummaryControls state={state} />

      {state.loading ? <p className="text-sm text-[#A1A1AA]">Chargement serveur...</p> : null}
      <SummaryList items={state.visibleItems} sources={state.sources} />
    </section>
  );
}
