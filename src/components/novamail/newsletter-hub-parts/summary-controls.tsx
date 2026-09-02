"use client";

import { type FormEvent } from "react";
import { Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNewsletterHubState } from "./use-newsletter-hub-state";
import type { NewsletterTopic } from "@/types/newsletters";
import { NEWSLETTER_TOPICS } from "./newsletter-hub-utils";

type NewsletterHubState = ReturnType<typeof useNewsletterHubState>;

export function SummaryControls({ state }: { state: NewsletterHubState }) {
  const onAddContent = async (e: FormEvent) => {
    e.preventDefault();
    await state.addContent();
  };

  return (
    <>
      <div className="mb-4 grid gap-2 md:grid-cols-[1fr_auto]">
        <Input
          value={state.query}
          onChange={(e) => state.setQuery(e.target.value)}
          placeholder="Filtrer les résumés par sujet, source, texte..."
          className="border-[#2A2A2D] bg-[#141417] text-[#E4E4E7]"
        />
        <Button
          onClick={() => void state.generateDigest()}
          disabled={state.aiBusy || state.loading}
          className="gap-2 bg-[#C49B66] text-black hover:bg-[#b58d5a]"
        >
          <Sparkles className="h-4 w-4" /> {state.aiBusy ? "Génération..." : "Générer un digest"}
        </Button>
      </div>

      <details className="mb-4 rounded-2xl border border-[#242427] bg-[#101012]/95 p-4">
        <summary className="cursor-pointer text-sm font-semibold text-white">
          Ajout manuel d’un résumé (option avancée)
        </summary>
        <form onSubmit={onAddContent} className="mt-3 grid gap-2 md:grid-cols-2">
          <Input
            aria-label="Titre du contenu"
            value={state.contentTitle}
            onChange={(e) => state.setContentTitle(e.target.value)}
            placeholder="Titre du résumé"
            className="border-[#2A2A2D] bg-[#141417] text-[#E4E4E7]"
          />
          <select
            aria-label="Source du contenu"
            value={state.contentSourceId}
            onChange={(e) => state.setContentSourceId(e.target.value)}
            className="h-10 rounded-md border border-[#2A2A2D] bg-[#141417] px-3 text-sm text-[#E4E4E7]"
          >
            <option value="">Sélectionner une source</option>
            {state.sources.map((src) => (
              <option key={src.id} value={src.id}>
                {src.name}
              </option>
            ))}
          </select>
          <Input
            aria-label="Résumé du contenu"
            value={state.contentSummary}
            onChange={(e) => state.setContentSummary(e.target.value)}
            placeholder="Résumé"
            className="border-[#2A2A2D] bg-[#141417] text-[#E4E4E7]"
          />
          <div className="grid grid-cols-[1fr_140px] gap-2">
            <Input
              aria-label="Lien du contenu"
              value={state.contentLink}
              onChange={(e) => state.setContentLink(e.target.value)}
              placeholder="Lien (optionnel)"
              className="border-[#2A2A2D] bg-[#141417] text-[#E4E4E7]"
            />
            <select
              aria-label="Sujet du contenu"
              value={state.contentTopic}
              onChange={(e) => state.setContentTopic(e.target.value as NewsletterTopic)}
              className="h-10 rounded-md border border-[#2A2A2D] bg-[#141417] px-3 text-sm text-[#E4E4E7]"
            >
              {NEWSLETTER_TOPICS.map((topic) => (
                <option key={topic} value={topic}>
                  {topic}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <Button
              type="submit"
              disabled={state.submitting || state.loading}
              variant="outline"
              className="gap-2 border-[#2A2A2D] bg-[#141417] text-[#E4E4E7] hover:bg-[#1B1B1F]"
            >
              <Plus className="h-4 w-4" /> Ajouter résumé
            </Button>
          </div>
        </form>
      </details>
    </>
  );
}
