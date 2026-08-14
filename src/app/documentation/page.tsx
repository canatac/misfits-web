"use client";

import { UserDocsGuide } from "@/components/documentation/user-docs-guide";
import { NovamailWorkspaceShell } from "@/components/navigation/novamail-workspace-shell";

export default function DocumentationPage() {
  return (
    <NovamailWorkspaceShell contentClassName="p-0">
      <div className="h-[calc(100vh-56px)]">
        <UserDocsGuide />
      </div>
    </NovamailWorkspaceShell>
  );
}
