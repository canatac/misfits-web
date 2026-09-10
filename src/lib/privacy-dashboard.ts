/**
 * Privacy Dashboard (Issue #474).
 *
 * GDPR/CCPA compliance utilities for data transparency, export, and deletion.
 */

export interface DataOverview {
  storageUsed: number; // bytes
  emailCount: number;
  contactCount: number;
  calendarEventCount: number;
  lastActivity: string;
}

export interface ActivityLogEntry {
  id: string;
  action: string;
  timestamp: string;
  ip?: string;
  userAgent?: string;
  details?: string;
}

export interface ThirdPartyApp {
  id: string;
  name: string;
  permissions: string[];
  lastUsed: string;
  connectedAt: string;
}

export interface PrivacySettings {
  dataCollection: boolean;
  analytics: boolean;
  thirdPartySharing: boolean;
  marketingEmails: boolean;
}

export interface DeleteAccountResult {
  success: boolean;
  message: string;
  requiresConfirmation: boolean;
  confirmationText?: string;
}

/**
 * Get data overview for privacy dashboard.
 */
export function getDataOverview(options: {
  storageUsed: number;
  emailCount: number;
  contactCount: number;
  calendarEventCount: number;
  lastActivity: string;
}): DataOverview {
  return { ...options };
}

/**
 * Format storage size for display.
 */
export function formatStorageSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

/**
 * Create an activity log entry.
 */
export function createActivityLogEntry(options: {
  action: string;
  ip?: string;
  userAgent?: string;
  details?: string;
}): ActivityLogEntry {
  return {
    id: `log-${Date.now()}`,
    action: options.action,
    timestamp: new Date().toISOString(),
    ip: options.ip,
    userAgent: options.userAgent,
    details: options.details,
  };
}

/**
 * Get recent activity log entries.
 */
export function getRecentActivity(
  entries: ActivityLogEntry[],
  limit: number = 10
): ActivityLogEntry[] {
  return [...entries]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
}

/**
 * Filter activity by action type.
 */
export function filterActivityByAction(
  entries: ActivityLogEntry[],
  action: string
): ActivityLogEntry[] {
  return entries.filter((e) => e.action === action);
}

/**
 * Create a third-party app entry.
 */
export function createThirdPartyApp(options: {
  name: string;
  permissions: string[];
  lastUsed: string;
  connectedAt: string;
}): ThirdPartyApp {
  return {
    id: `app-${Date.now()}`,
    ...options,
  };
}

/**
 * Revoke third-party app access.
 */
export function revokeAppAccess(
  apps: ThirdPartyApp[],
  appId: string
): ThirdPartyApp[] {
  return apps.filter((a) => a.id !== appId);
}

/**
 * Check if app has specific permission.
 */
export function appHasPermission(app: ThirdPartyApp, permission: string): boolean {
  return app.permissions.includes(permission);
}

/**
 * Get default privacy settings.
 */
export function getDefaultPrivacySettings(): PrivacySettings {
  return {
    dataCollection: true,
    analytics: false,
    thirdPartySharing: false,
    marketingEmails: false,
  };
}

/**
 * Update privacy settings.
 */
export function updatePrivacySettings(
  settings: PrivacySettings,
  updates: Partial<PrivacySettings>
): PrivacySettings {
  return { ...settings, ...updates };
}

/**
 * Validate account deletion confirmation.
 */
export function validateDeleteConfirmation(
  input: string,
  expected: string = "DELETE"
): boolean {
  return input.trim().toUpperCase() === expected;
}

/**
 * Create delete account result.
 */
export function createDeleteAccountResult(
  confirmed: boolean,
  confirmationText?: string
): DeleteAccountResult {
  if (!confirmed) {
    return {
      success: false,
      message: "Account deletion requires confirmation",
      requiresConfirmation: true,
      confirmationText: "DELETE",
    };
  }

  return {
    success: true,
    message: "Account deletion initiated",
    requiresConfirmation: false,
  };
}

/**
 * Export all user data as JSON.
 */
export function exportUserData(options: {
  emails: unknown[];
  contacts: unknown[];
  calendarEvents: unknown[];
  settings: PrivacySettings;
  activityLog: ActivityLogEntry[];
}): string {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      ...options,
    },
    null,
    2
  );
}

/**
 * Download user data as JSON file.
 */
export function downloadUserData(
  options: {
    emails: unknown[];
    contacts: unknown[];
    calendarEvents: unknown[];
    settings: PrivacySettings;
    activityLog: ActivityLogEntry[];
  },
  filename?: string
): void {
  const json = exportUserData(options);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || `misfits-data-export-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Get privacy settings description.
 */
export function getPrivacySettingDescription(key: keyof PrivacySettings): string {
  const descriptions: Record<keyof PrivacySettings, string> = {
    dataCollection: "Allow collection of usage data to improve the service",
    analytics: "Allow anonymous analytics tracking",
    thirdPartySharing: "Share data with third-party services",
    marketingEmails: "Receive marketing emails about new features",
  };
  return descriptions[key];
}

/**
 * Check if privacy settings are GDPR compliant.
 */
export function isGDPRCompliant(settings: PrivacySettings): boolean {
  return !settings.thirdPartySharing && !settings.marketingEmails;
}
