import { AppSwitcher } from "@/components/navigation/app-switcher";
import { DashboardLeftRail } from "@/components/dashboard/dashboard-left-rail";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[#09090B] text-[#E4E4E7]">
      <AppSwitcher className="border-[#242427] bg-[#111113]/95 text-[#E4E4E7]" />
      <div className="flex flex-1 overflow-hidden">
        <DashboardLeftRail />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="mx-auto w-full max-w-[1500px] space-y-4">{children}</div>
        </main>
      </div>
    </div>
  );
}
