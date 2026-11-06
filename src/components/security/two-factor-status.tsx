"use client";

import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";

export function TwoFactorStatus() {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-green-500" aria-hidden="true" />
        <span className="text-sm">Two-factor authentication is enabled</span>
      </div>
      <Button variant="outline" size="sm" disabled>
        Manage
      </Button>
    </div>
  );
}
