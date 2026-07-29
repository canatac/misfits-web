"use client";

/**
 * /contacts route — renders the intelligent address book (Issue #152).
 * Thin wrapper so the heavy logic stays in the shared `ContactsPage`
 * component which is wired to the Zustand contact store.
 */
import { ContactsPage } from "@/components/mail/contacts-page";

export default function ContactsRoute() {
  return <ContactsPage />;
}
