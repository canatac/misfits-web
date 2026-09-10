/**
 * Email list density setting (Issue #455).
 *
 * Compact, comfortable, and spacious row height options
 * with localStorage persistence and CSS variable support.
 */

export type DensitySetting = "compact" | "comfortable" | "spacious";

export interface DensityConfig {
  rowHeight: number;
  fontSize: number;
  padding: number;
  avatarSize: number;
}

export const DENSITY_CONFIGS: Record<DensitySetting, DensityConfig> = {
  compact: {
    rowHeight: 32,
    fontSize: 12,
    padding: 4,
    avatarSize: 24,
  },
  comfortable: {
    rowHeight: 48,
    fontSize: 14,
    padding: 8,
    avatarSize: 32,
  },
  spacious: {
    rowHeight: 64,
    fontSize: 16,
    padding: 12,
    avatarSize: 40,
  },
};

export const DEFAULT_DENSITY: DensitySetting = "comfortable";

/**
 * Get density config.
 */
export function getDensityConfig(setting: DensitySetting): DensityConfig {
  return DENSITY_CONFIGS[setting];
}

/**
 * Get row height for density setting.
 */
export function getRowHeight(setting: DensitySetting): number {
  return DENSITY_CONFIGS[setting].rowHeight;
}

/**
 * Get CSS variables for density.
 */
export function getDensityCSSVars(setting: DensitySetting): Record<string, string> {
  const config = DENSITY_CONFIGS[setting];
  return {
    "--email-row-height": `${config.rowHeight}px`,
    "--email-font-size": `${config.fontSize}px`,
    "--email-padding": `${config.padding}px`,
    "--email-avatar-size": `${config.avatarSize}px`,
  };
}

/**
 * Load density from localStorage.
 */
export function loadDensity(): DensitySetting {
  if (typeof window === "undefined") return DEFAULT_DENSITY;
  const stored = localStorage.getItem("email-density");
  if (stored && stored in DENSITY_CONFIGS) {
    return stored as DensitySetting;
  }
  return DEFAULT_DENSITY;
}

/**
 * Save density to localStorage.
 */
export function saveDensity(setting: DensitySetting): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("email-density", setting);
}

/**
 * Check if density is valid.
 */
export function isValidDensity(setting: string): setting is DensitySetting {
  return setting in DENSITY_CONFIGS;
}

/**
 * Get all density options.
 */
export function getDensityOptions(): Array<{ id: DensitySetting; label: string; description: string }> {
  return [
    { id: "compact", label: "Compact", description: "More emails per screen" },
    { id: "comfortable", label: "Comfortable", description: "Default spacing" },
    { id: "spacious", label: "Spacious", description: "Larger touch targets" },
  ];
}

/**
 * Get recommended density for mobile.
 */
export function getMobileDensity(): DensitySetting {
  return "spacious";
}
