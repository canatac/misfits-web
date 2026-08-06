"use client";

import { AppSwitcher } from "@/components/navigation/app-switcher";
import { TranslationTool } from "@/components/novamail/translation-tool";

export default function TranslationPage() {
  return (
    <div className="min-h-screen bg-[#09090B]">
      <AppSwitcher className="border-[#242427] bg-[#111113]/95 text-[#E4E4E7]" />
      <div className="h-[calc(100vh-56px)]">
        <TranslationTool />
      </div>
    </div>
  );
}
