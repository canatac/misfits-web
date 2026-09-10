"use client";

import { useState } from "react";
import { Bell, BellOff, Volume2, VolumeX, Clock, Star, FolderOpen, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNotificationPreferences, type NotificationSound } from "@/stores/notification-preferences";
import { useEmailStore } from "@/stores/email-store";

const SOUND_OPTIONS: { value: NotificationSound; label: string }[] = [
  { value: "chime", label: "Chime" },
  { value: "bell", label: "Bell" },
  { value: "pop", label: "Pop" },
  { value: "none", label: "None" },
];

export function NotificationPreferencesPanel() {
  const prefs = useNotificationPreferences((s) => s.prefs);
  const folders = useEmailStore((s) => s.folders);
  const updatePrefs = useNotificationPreferences((s) => s.updatePrefs);
  const setFolderPref = useNotificationPreferences((s) => s.setFolderPref);
  const requestBrowserPermission = useNotificationPreferences((s) => s.requestBrowserPermission);
  const clearPermission = useNotificationPreferences((s) => s.clearPermission);
  const inQuietHours = useNotificationPreferences((s) => s.isInQuietHours)();

  const handleToggle = async (checked: boolean) => {
    if (checked) {
      await requestBrowserPermission();
    } else {
      updatePrefs({ enabled: false });
    }
  };

  return (
    <div className="space-y-6" data-testid="notification-preferences-panel">
      <div>
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          {prefs.enabled ? <Bell className="h-5 w-5 text-[#C49B66]" /> : <BellOff className="h-5 w-5 text-[#71717A]" />}
          Notifications
        </h2>
        <p className="text-sm text-[#71717A] mt-1">Configure desktop notifications for new emails.</p>
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-white">Enable desktop notifications</div>
            <p className="text-xs text-[#71717A] mt-0.5">
              {prefs.browserPermission === "granted" ? "Browser permission granted"
                : prefs.browserPermission === "denied" ? "Browser permission denied"
                : "Click to request browser permission"}
            </p>
          </div>
          <Switch checked={prefs.enabled} onCheckedChange={handleToggle}
            disabled={prefs.browserPermission === "denied"} data-testid="notification-master-toggle" />
        </div>
        {prefs.browserPermission === "denied" && (
          <div className="mt-3 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="text-xs text-red-400">
              Notifications are blocked. Please enable them in your browser settings, then{" "}
              <button onClick={clearPermission} className="underline hover:text-red-300">try again</button>.
            </p>
          </div>
        )}
      </Card>

      <Card className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-[#C49B66]" />
            <div>
              <div className="text-sm font-medium text-white">Quiet hours</div>
              <p className="text-xs text-[#71717A]">Suppress notifications during configured time</p>
            </div>
          </div>
          <Switch checked={prefs.quietHoursEnabled} onCheckedChange={(c) => updatePrefs({ quietHoursEnabled: c })} data-testid="quiet-hours-toggle" />
        </div>
        {prefs.quietHoursEnabled && (
          <div className="flex items-center gap-3">
            <input type="time" value={prefs.quietHoursStart} onChange={(e) => updatePrefs({ quietHoursStart: e.target.value })}
              className="flex h-10 rounded-lg border border-[#242427] bg-[#121214] px-3 text-sm text-white focus:border-[#C49B66] focus:outline-none" data-testid="quiet-hours-start" />
            <span className="text-sm text-[#71717A]">to</span>
            <input type="time" value={prefs.quietHoursEnd} onChange={(e) => updatePrefs({ quietHoursEnd: e.target.value })}
              className="flex h-10 rounded-lg border border-[#242427] bg-[#121214] px-3 text-sm text-white focus:border-[#C49B66] focus:outline-none" data-testid="quiet-hours-end" />
            {inQuietHours && <Badge variant="secondary" className="ml-auto">Active now</Badge>}
          </div>
        )}
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-[#C49B66]" />
            <div>
              <div className="text-sm font-medium text-white">VIP-only mode</div>
              <p className="text-xs text-[#71717A]">Only notify for starred emails</p>
            </div>
          </div>
          <Switch checked={prefs.vipOnly} onCheckedChange={(c) => updatePrefs({ vipOnly: c })} data-testid="vip-only-toggle" />
        </div>
      </Card>

      <Card className="p-4 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <FolderOpen className="h-4 w-4 text-[#C49B66]" />
          <div className="text-sm font-medium text-white">Per-folder notifications</div>
        </div>
        <div className="space-y-2">
          {folders.map((folder) => (
            <div key={folder.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-[#1D1D20]/60">
              <div className="flex items-center gap-2">
                <span className="text-sm text-[#E0E0E0]">{folder.name}</span>
                {folder.unreadCount > 0 && <Badge variant="secondary" className="text-[10px]">{folder.unreadCount}</Badge>}
              </div>
              <Switch checked={prefs.folderPrefs[folder.id] ?? false} onCheckedChange={(c) => setFolderPref(folder.id, c)} data-testid={`folder-toggle-${folder.id}`} />
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          {prefs.sound === "none" ? <VolumeX className="h-4 w-4 text-[#71717A]" /> : <Volume2 className="h-4 w-4 text-[#C49B66]" />}
          <div className="text-sm font-medium text-white">Notification sound</div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {SOUND_OPTIONS.map((opt) => (
            <Button key={opt.value} variant={prefs.sound === opt.value ? "default" : "outline"} size="sm"
              onClick={() => updatePrefs({ sound: opt.value })}
              className={cn("justify-start text-xs", prefs.sound === opt.value && "border-[#C49B66] bg-[#C49B66]/10 text-[#C49B66]")}
              data-testid={`sound-option-${opt.value}`}>
              {prefs.sound === opt.value && <Check className="h-3 w-3 mr-1" />}
              {opt.label}
            </Button>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <div className="text-sm font-medium text-white mb-3">Notification preview</div>
        <div className="rounded-xl border border-[#242427] bg-[#0A0A0B] p-4 shadow-lg">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-[#C49B66]/20 flex items-center justify-center">
              <Bell className="h-5 w-5 text-[#C49B66]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">New email from John Doe</div>
              <div className="text-xs text-[#A1A1AA] mt-0.5 line-clamp-2">Hey, just wanted to follow up on our meeting yesterday...</div>
              <div className="text-[10px] text-[#71717A] mt-1">Misfits Mail &middot; just now</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default NotificationPreferencesPanel;
