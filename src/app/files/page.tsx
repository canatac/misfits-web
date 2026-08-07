import { NovamailWorkspaceShell } from "@/components/navigation/novamail-workspace-shell";

export default function FilesPage() {
  return (
    <NovamailWorkspaceShell>
      <div className="mx-auto max-w-4xl rounded-2xl border border-[#242427] bg-[#121214] p-6">
        <h1 className="text-xl font-bold text-white">Files Workspace</h1>
        <p className="mt-2 text-sm text-[#A1A1AA]">
          Files panel placeholder for NovaMail parity navigation.
        </p>
      </div>
    </NovamailWorkspaceShell>
  );
}
