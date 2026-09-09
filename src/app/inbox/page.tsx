"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function InboxPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/mail");
  }, [router]);
  return null;
}
