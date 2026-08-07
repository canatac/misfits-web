import { NovamailWorkspaceShell } from "@/components/navigation/novamail-workspace-shell";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <NovamailWorkspaceShell contentClassName="p-4 md:p-6">
      <div className="mx-auto w-full max-w-[1500px] space-y-4">{children}</div>
    </NovamailWorkspaceShell>
  );
}
