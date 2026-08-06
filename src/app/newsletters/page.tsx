"use client";

import { AppSwitcher } from "@/components/navigation/app-switcher";
import { NewsletterHub } from "@/components/novamail/newsletter-hub";

export default function NewslettersPage() {
  return (
    <div className="min-h-screen bg-[#09090B]">
      <AppSwitcher className="border-[#242427] bg-[#111113]/95 text-[#E4E4E7]" />
      <div className="h-[calc(100vh-56px)]">
        <NewsletterHub />
      </div>
    </div>
  );
}
