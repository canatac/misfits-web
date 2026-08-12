import { NovamailWorkspaceShell } from "@/components/navigation/novamail-workspace-shell";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NovamailWorkspaceShell>
      <main className="mx-auto w-full max-w-[1200px] space-y-4">
        {children}
      </main>
    </NovamailWorkspaceShell>
  );
}
