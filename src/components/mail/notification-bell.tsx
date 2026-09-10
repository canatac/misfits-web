"use client";

import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotificationPreferences } from "@/stores/notification-preferences";
import { cn } from "@/lib/utils";

interface NotificationBellProps {
  onClick?: () => void;
}

export function NotificationBell({ onClick }: NotificationBellProps) {
  const prefs = useNotificationPreferences((s) => s.prefs);
  const requestBrowserPermission = useNotificationPreferences((s) => s.requestBrowserPermission);

  const handleClick = async () => {
    if (!prefs.enabled) {
      await requestBrowserPermission();
    }
    onClick?.();
  };

  return (
    <Button variant="ghost" size="icon" onClick={handleClick}
      className={cn("relative", prefs.enabled ? "text-[#C49B66]" : "text-[#71717A]")}
      title={prefs.enabled ? "Notifications active" : "Notifications off"}
      aria-label={prefs.enabled ? "Notifications active" : "Notifications off"}
      data-testid="notification-bell" data-enabled={prefs.enabled}>
      {prefs.enabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
    </Button>
  );
}
