/**
 * Settings page with tabbed navigation (Issue #434).
 *
 * Unified settings hub with vertical sidebar nav and URL-based routing.
 */

export interface SettingsSection {
  id: string;
  label: string;
  icon?: string;
  href: string;
  description?: string;
}

export const SETTINGS_SECTIONS: SettingsSection[] = [
  { id: "general", label: "General", href: "/settings/general", description: "Theme, language, display" },
  { id: "notifications", label: "Notifications", href: "/settings/notifications", description: "Email alerts, sounds" },
  { id: "accounts", label: "Accounts", href: "/settings/accounts", description: "Manage email accounts" },
  { id: "filters", label: "Filters", href: "/settings/filters", description: "Inbox rules, blocked senders" },
  { id: "statistics", label: "Statistics", href: "/settings/statistics", description: "Usage analytics" },
  { id: "ai", label: "AI", href: "/settings/ai", description: "Hermes AI settings" },
];

/**
 * Get all settings sections.
 */
export function getSettingsSections(): SettingsSection[] {
  return SETTINGS_SECTIONS;
}

/**
 * Get section by ID.
 */
export function getSectionById(id: string): SettingsSection | undefined {
  return SETTINGS_SECTIONS.find((s) => s.id === id);
}

/**
 * Get default section (general).
 */
export function getDefaultSection(): SettingsSection {
  return SETTINGS_SECTIONS[0];
}

/**
 * Check if section is active.
 */
export function isSectionActive(section: SettingsSection, currentPath: string): boolean {
  return currentPath.startsWith(section.href);
}

/**
 * Get section by path.
 */
export function getSectionByPath(path: string): SettingsSection | undefined {
  return SETTINGS_SECTIONS.find((s) => path.startsWith(s.href));
}
