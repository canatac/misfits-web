import { AppSwitcher } from "@/components/navigation/app-switcher";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <AppSwitcher />
      <main className="mx-auto w-full max-w-[1200px] space-y-4 p-4 md:p-6">{children}</main>
    </div>
  );
}
