"use client";

import { useRouter } from "next/navigation";
import { NovaMailIconRail } from "@/components/mail/novamail-icon-rail";

export function DashboardLeftRail() {
  const router = useRouter();

  return <NovaMailIconRail onCompose={() => router.push("/mail")} />;
}
