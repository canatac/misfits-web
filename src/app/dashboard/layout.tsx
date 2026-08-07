import { AppSwitcher } from "@/components/navigation/app-switcher";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#09090B] text-[#E4E4E7]">
      <AppSwitcher className="border-[#242427] bg-[#111113]/95 text-[#E4E4E7]" />
      <main className="mx-auto w-full max-w-[1500px] space-y-4 p-4 md:p-6">
        {children}
      </main>
    </div>
  );
}
