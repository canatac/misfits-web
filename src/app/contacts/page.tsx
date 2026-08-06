"use client";

/**
 * /contacts route — renders the intelligent address book (Issue #152).
 * Thin wrapper so the heavy logic stays in the shared `ContactsPage`
 * component which is wired to the Zustand contact store.
 */
import { ContactsPage } from "@/components/mail/contacts-page";
import { AppSwitcher } from "@/components/navigation/app-switcher";

export default function ContactsRoute() {
  return (
    <div className="min-h-screen bg-[#09090B] text-[#E4E4E7]">
      <AppSwitcher className="border-[#242427] bg-[#111113]/95 text-[#E4E4E7]" />
      <div className="h-[calc(100vh-56px)]">
        <ContactsPage />
      </div>
    </div>
  );
}
