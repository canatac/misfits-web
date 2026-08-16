"use client";

import React, { useState } from "react";
import { BookOpen, HelpCircle, Search } from "lucide-react";
import { CATEGORIES, FAQ_LIST } from "./user-docs-guide/data";
import {
  OverviewSection,
  SigninSection,
  InboxSection,
  ComposeSection,
  AccountSection,
  ShortcutsSection,
} from "./user-docs-guide/sections";

export const UserDocsGuide: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const categories = CATEGORIES;
  const faqList = FAQ_LIST;

  const filteredFaq = faqList.filter(
    (f) =>
      f.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.a.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const showAll = activeCategory === "all";

  return (
    <div className="flex-1 overflow-y-auto bg-[#0A0A0B] text-[#E0E0E0] p-6 lg:p-8 space-y-8 custom-scrollbar">
      {/* Hero */}
      <div className="relative p-6 lg:p-8 rounded-3xl bg-gradient-to-r from-[#121214] via-[#1D1D20] to-[#121214] border border-[#242427] shadow-2xl overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-[#C49B66]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C49B66]/15 border border-[#C49B66]/30 text-[#C49B66] text-xs font-mono font-medium">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Documentation utilisateur • misfits.ai Mail</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight leading-tight">
            Bien démarrer avec misfits.ai Mail
          </h1>
          <p className="text-xs lg:text-sm text-[#A1A1AA] leading-relaxed">
            Ce guide vous accompagne pas à pas dans la prise en main de votre
            messagerie : connexion sécurisée, gestion de la boîte de réception,
            rédaction de messages, préférences personnelles et raccourcis
            clavier.
          </p>
          <div className="pt-2 max-w-md">
            <div className="relative">
              <Search className="w-4 h-4 text-[#71717A] absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher une question ou une fonctionnalité..."
                className="w-full bg-[#0A0A0B]/80 border border-[#242427] focus:border-[#C49B66] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-[#52525B] focus:outline-none backdrop-blur-md"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Category pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-2 border ${
                isActive
                  ? "bg-[#C49B66] text-[#0A0A0B] border-[#C49B66] shadow-md font-bold"
                  : "bg-[#121214] text-[#A1A1AA] border-[#242427] hover:text-white hover:border-[#C49B66]/40"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {(showAll || activeCategory === "overview") && <OverviewSection />}
      {(showAll || activeCategory === "signin") && <SigninSection />}
      {(showAll || activeCategory === "inbox") && <InboxSection />}
      {(showAll || activeCategory === "compose") && <ComposeSection />}
      {(showAll || activeCategory === "account") && <AccountSection />}
      {(showAll || activeCategory === "shortcuts") && <ShortcutsSection />}

      {/* FAQ */}
      <section className="p-6 rounded-2xl bg-[#121214] border border-[#242427] space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#C49B66]/10 border border-[#C49B66]/30 flex items-center justify-center">
            <HelpCircle className="w-5 h-5 text-[#C49B66]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Foire aux questions</h2>
            <p className="text-xs text-[#71717A]">Les réponses aux questions les plus courantes</p>
          </div>
        </div>
        <div className="space-y-3">
          {filteredFaq.length > 0 ? (
            filteredFaq.map((item, i) => (
              <div key={i} className="p-4 rounded-xl bg-[#0A0A0B] border border-[#242427] space-y-1.5">
                <h3 className="text-xs font-bold text-white flex items-center gap-2">
                  <span className="text-[#C49B66]">Q :</span>
                  <span>{item.q}</span>
                </h3>
                <p className="text-xs text-[#A1A1AA] pl-5 leading-relaxed">{item.a}</p>
              </div>
            ))
          ) : (
            <p className="text-xs text-[#71717A] py-4 text-center">
              Aucune question ne correspond à votre recherche.
            </p>
          )}
        </div>
      </section>
    </div>
  );
};

export default UserDocsGuide;
