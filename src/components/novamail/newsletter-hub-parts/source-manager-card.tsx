"use client";

import { type FormEvent } from "react";
import { ExternalLink, Pencil, Plus, Save, Sparkles, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNewsletterHubState } from "./use-newsletter-hub-state";

type NewsletterHubState = ReturnType<typeof useNewsletterHubState>;

export function SourceManagerCard({ state }: { state: NewsletterHubState }) {
  const onAddSource = async (e: FormEvent) => {
    e.preventDefault();
    await state.addSource();
  };

  return (
    <div className="mb-4 rounded-2xl border border-[#242427] bg-[#101012]/95 p-4">
      <h2 className="mb-3 text-sm font-semibold text-white">Sources d’information (URL)</h2>

      <form onSubmit={onAddSource} className="mb-3 grid gap-2 md:grid-cols-[220px_1fr_auto]">
        <Input
          aria-label="Nom de la source"
          value={state.sourceName}
          onChange={(e) => state.setSourceName(e.target.value)}
          placeholder="Nom (optionnel)"
          className="border-[#2A2A2D] bg-[#141417] text-[#E4E4E7]"
        />
        <Input
          aria-label="URL de la source"
          value={state.sourceUrl}
          onChange={(e) => state.setSourceUrl(e.target.value)}
          placeholder="https://exemple.com/feed"
          className="border-[#2A2A2D] bg-[#141417] text-[#E4E4E7]"
        />
        <Button
          type="submit"
          disabled={state.submitting || state.loading}
          variant="outline"
          className="gap-2 border-[#2A2A2D] bg-[#141417] text-[#E4E4E7] hover:bg-[#1B1B1F]"
        >
          <Plus className="h-4 w-4" /> Ajouter URL
        </Button>
      </form>

      <div className="space-y-2">
        {state.sources.length === 0 ? (
          <p className="rounded-xl border border-[#242427] bg-[#0A0A0B] p-3 text-xs text-[#71717A]">
            Aucune source URL pour le moment.
          </p>
        ) : (
          state.sources.map((src) => {
            const isEditing = state.editingSourceId === src.id;
            return (
              <div key={src.id} className="rounded-xl border border-[#242427] bg-[#0A0A0B] p-3">
                {isEditing ? (
                  <div className="grid gap-2 md:grid-cols-[220px_1fr_auto_auto]">
                    <Input
                      aria-label="Nom source édition"
                      value={state.editingSourceName}
                      onChange={(e) => state.setEditingSourceName(e.target.value)}
                      placeholder="Nom"
                      className="border-[#2A2A2D] bg-[#141417] text-[#E4E4E7]"
                    />
                    <Input
                      aria-label="URL source édition"
                      value={state.editingSourceUrl}
                      onChange={(e) => state.setEditingSourceUrl(e.target.value)}
                      placeholder="https://exemple.com/feed"
                      className="border-[#2A2A2D] bg-[#141417] text-[#E4E4E7]"
                    />
                    <Button
                      type="button"
                      disabled={state.savingSourceId === src.id}
                      onClick={() => void state.updateSource(src.id)}
                      variant="outline"
                      className="gap-2 border-[#2A2A2D] bg-[#141417] text-[#E4E4E7] hover:bg-[#1B1B1F]"
                    >
                      <Save className="h-4 w-4" /> Enregistrer
                    </Button>
                    <Button
                      type="button"
                      onClick={state.cancelEditSource}
                      variant="outline"
                      className="gap-2 border-[#2A2A2D] bg-[#141417] text-[#E4E4E7] hover:bg-[#1B1B1F]"
                    >
                      <X className="h-4 w-4" /> Annuler
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white">{src.name}</p>
                      {src.url ? (
                        <a
                          href={src.url}
                          className="inline-flex items-center gap-1 text-xs text-[#E9C995] hover:underline"
                        >
                          {src.url}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <p className="text-xs text-[#71717A]">URL non renseignée</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        onClick={() => state.startEditSource(src)}
                        variant="outline"
                        className="gap-2 border-[#2A2A2D] bg-[#141417] text-[#E4E4E7] hover:bg-[#1B1B1F]"
                      >
                        <Pencil className="h-4 w-4" /> Modifier
                      </Button>
                      <Button
                        type="button"
                        onClick={() => void state.deleteSource(src)}
                        disabled={state.deletingSourceId === src.id}
                        variant="outline"
                        className="gap-2 border-[#3A2626] bg-[#1A1212] text-[#F8B4B4] hover:bg-[#241515]"
                      >
                        <Trash2 className="h-4 w-4" /> Supprimer
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="mt-4 rounded-xl border border-[#242427] bg-[#0A0A0B] p-3">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-white">
          <Sparkles className="h-4 w-4 text-[#E9C995]" /> Suggestions d&apos;abonnements
        </div>
        {state.interests.length > 0 ? (
          <p className="mb-3 text-xs text-[#A1A1AA]">
            Intérêts détectés: {state.interests.join(" · ")}
          </p>
        ) : null}

        {state.suggestions.length === 0 ? (
          <p className="text-xs text-[#71717A]">
            Pas encore de suggestions. Ajoute quelques sources/résumés pour affiner.
          </p>
        ) : (
          <div className="space-y-2">
            {state.suggestions.map((s) => (
              <div
                key={`${s.kind}-${s.url}`}
                className="flex flex-col gap-2 rounded-lg border border-[#242427] bg-[#101012] p-3 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-white">
                    {s.title} <span className="text-xs text-[#A1A1AA]">({s.kind})</span>
                  </p>
                  <a
                    href={s.url}
                    className="inline-flex items-center gap-1 text-xs text-[#E9C995] hover:underline"
                  >
                    {s.url}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  <p className="mt-1 text-xs text-[#A1A1AA]">{s.reason}</p>
                </div>
                <Button
                  type="button"
                  disabled={state.submitting || state.loading}
                  onClick={() => void state.addSuggestedSource(s)}
                  variant="outline"
                  className="gap-2 border-[#2A2A2D] bg-[#141417] text-[#E4E4E7] hover:bg-[#1B1B1F]"
                >
                  <Plus className="h-4 w-4" /> S&apos;abonner
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
