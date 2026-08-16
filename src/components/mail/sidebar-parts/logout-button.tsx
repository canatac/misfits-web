"use client";

import { useLogoutAction } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const logout = useLogoutAction();
  return (
    <Button
      variant="ghost"
      className="w-full justify-start gap-2 text-[var(--color-muted-fg)] hover:text-[var(--color-danger-500)]"
      onClick={logout}
      data-testid="logout-button"
    >
      <LogOut className="h-4 w-4" />
      Se déconnecter
    </Button>
  );
}
