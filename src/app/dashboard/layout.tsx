import { AppSwitcher } from "@/components/navigation/app-switcher";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#09090B] text-[#E4E4E7]">
      <AppSwitcher className="border-[#242427] bg-[#111113]/95 text-[#E4E4E7]" />
      <main className="mx-auto w-full max-w-[1500px] space-y-4 p-4 md:p-6">
        <header className="rounded-2xl border border-[#2A2A2D] bg-[#111113]/90 p-4">
          <h1 className="text-2xl font-bold">Ops Dashboard</h1>
          <p className="text-sm text-[#A1A1AA]">Monitoring SMTP + posture sécurité en temps réel.</p>
        </header>
        {children}
      </main>
    </div>
  );
}
