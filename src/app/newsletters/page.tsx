"use client";

import { NewsletterHub } from "@/components/novamail/newsletter-hub";
import { NovamailWorkspaceShell } from "@/components/navigation/novamail-workspace-shell";

export default function NewslettersPage() {
  return (
    <NovamailWorkspaceShell contentClassName="p-0">
      <div className="h-[calc(100vh-56px)]">
        <NewsletterHub />
      </div>
    </NovamailWorkspaceShell>
  );
}
