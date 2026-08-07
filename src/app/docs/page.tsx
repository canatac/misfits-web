"use client";

import { UserDocsGuide } from "@/components/novamail/user-docs-guide";
import { NovamailWorkspaceShell } from "@/components/navigation/novamail-workspace-shell";

export default function DocsPage() {
  return (
    <NovamailWorkspaceShell contentClassName="p-0">
      <div className="h-[calc(100vh-56px)]">
        <UserDocsGuide />
      </div>
    </NovamailWorkspaceShell>
  );
}
