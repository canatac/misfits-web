"use client";

import { BookOpen, LifeBuoy } from "lucide-react";

const sections = [
  {
    title: "1. Démarrage rapide",
    body: "Connectez votre compte, ouvrez Mail, puis testez Compose + Search (⌘/Ctrl+K). Les panneaux gauche/droite sont pilotables indépendamment.",
  },
  {
    title: "2. Gestion des boîtes",
    body: "Utilisez Unified Inbox pour consolider plusieurs comptes. Les dossiers (Inbox/Sent/Drafts/Spam/Trash) restent source-of-truth côté API.",
  },
  {
    title: "3. Assistant Hermes",
    body: "Depuis le panneau droit ou 'Demander à Hermes', générez résumés, réponses, traductions et TODO avec contexte du thread courant.",
  },
  {
    title: "4. Newsletters & Translation",
    body: "Le hub Newsletters aide à filtrer le bruit informationnel. Translation Nuance Lab fournit une traduction FR + explications de nuances.",
  },
  {
    title: "5. Admin séparé",
    body: "Le pilotage ops/sécurité/changelog reste dans /admin et /dashboard pour éviter de polluer le flux mail principal.",
  },
];

export function UserDocsGuide() {
  return (
    <section className="h-full overflow-auto p-4 md:p-6 text-[#E4E4E7]">
      <header className="mb-4 rounded-2xl border border-[#2A2A2D] bg-[#111113]/90 p-4">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#3A3126] bg-[#1A1611] px-3 py-1 text-xs text-[#E9C995]">
          <BookOpen className="h-3.5 w-3.5" />
          User Docs Guide
        </div>
        <h1 className="text-xl font-bold">Documentation Utilisateur</h1>
        <p className="text-sm text-[#A1A1AA]">Guide opérationnel rapide pour exploiter la suite mail premium.</p>
      </header>

      <div className="space-y-3">
        {sections.map((s) => (
          <details key={s.title} className="rounded-2xl border border-[#242427] bg-[#101012]/95 p-4" open>
            <summary className="cursor-pointer list-none text-sm font-semibold text-white">{s.title}</summary>
            <p className="mt-2 text-sm text-[#C4C4CC]">{s.body}</p>
          </details>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-[#3A3126] bg-[#1A1611] p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#F2D5A7]">
          <LifeBuoy className="h-4 w-4" />
          Support interne
        </div>
        <p className="mt-1 text-sm text-[#D4D4D8]">
          En cas de doute produit/ops, ouvre une change request dans Admin pour tracer la décision.
        </p>
      </div>
    </section>
  );
}
