"use client";

import { NotificationPreferencesPanel } from "@/components/mail/notification-preferences-panel";

export default function NotificationsSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Notifications</h1>
        <p className="text-sm text-[#71717A] mt-1">Manage desktop notifications and quiet hours.</p>
      </div>
      <NotificationPreferencesPanel />
    </div>
  );
}
