"use client";

import { TranslationTool } from "@/components/novamail/translation-tool";
import { NovamailWorkspaceShell } from "@/components/navigation/novamail-workspace-shell";

export default function TranslationPage() {
  return (
    <NovamailWorkspaceShell contentClassName="p-0">
      <div className="h-[calc(100vh-56px)]">
        <TranslationTool />
      </div>
    </NovamailWorkspaceShell>
  );
}
