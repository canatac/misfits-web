/**
 * Masked email aliases utility (Issue #516).
 *
 * Provides anti-spam protection through random email aliases that forward
 * to the main inbox. Supports creation, disabling, and activity tracking.
 */

export interface EmailAlias {
  id: string;
  alias: string; // e.g., "a1b2c3@misfits.ai"
  isActive: boolean;
  createdAt: string;
  description?: string;
  stats: {
    received: number;
    forwarded: number;
    lastActivity: string | null;
  };
}

export interface AliasCreationResult {
  success: boolean;
  alias?: EmailAlias;
  error?: string;
}

export interface AliasStats {
  total: number;
  active: number;
  disabled: number;
  totalReceived: number;
  totalForwarded: number;
}

export const ALIAS_LIMITS = {
  free: 10,
  pro: Infinity,
  admin: Infinity,
};

export const ALIAS_DOMAIN = "misfits.ai";

/**
 * Generate a random alias string.
 */
export function generateAliasString(length: number = 8): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Create a new email alias.
 */
export function createAlias(options: {
  description?: string;
  currentUserAliases: EmailAlias[];
  tier?: "free" | "pro" | "admin";
}): AliasCreationResult {
  const tier = options.tier || "free";
  const limit = ALIAS_LIMITS[tier];

  if (options.currentUserAliases.length >= limit) {
    return {
      success: false,
      error: `Alias limit reached (${limit} for ${tier} tier)`,
    };
  }

  const aliasString = generateAliasString();
  const alias: EmailAlias = {
    id: `alias-${Date.now()}`,
    alias: `${aliasString}@${ALIAS_DOMAIN}`,
    isActive: true,
    createdAt: new Date().toISOString(),
    description: options.description,
    stats: {
      received: 0,
      forwarded: 0,
      lastActivity: null,
    },
  };

  return { success: true, alias };
}

/**
 * Disable an alias (block incoming emails).
 */
export function disableAlias(alias: EmailAlias): EmailAlias {
  return { ...alias, isActive: false };
}

/**
 * Enable a previously disabled alias.
 */
export function enableAlias(alias: EmailAlias): EmailAlias {
  return { ...alias, isActive: true };
}

/**
 * Check if an alias is active.
 */
export function isAliasActive(alias: EmailAlias): boolean {
  return alias.isActive;
}

/**
 * Record received email for an alias.
 */
export function recordAliasReceived(alias: EmailAlias): EmailAlias {
  return {
    ...alias,
    stats: {
      ...alias.stats,
      received: alias.stats.received + 1,
      lastActivity: new Date().toISOString(),
    },
  };
}

/**
 * Record forwarded email for an alias.
 */
export function recordAliasForwarded(alias: EmailAlias): EmailAlias {
  return {
    ...alias,
    stats: {
      ...alias.stats,
      forwarded: alias.stats.forwarded + 1,
      lastActivity: new Date().toISOString(),
    },
  };
}

/**
 * Get active aliases.
 */
export function getActiveAliases(aliases: EmailAlias[]): EmailAlias[] {
  return aliases.filter((a) => a.isActive);
}

/**
 * Get disabled aliases.
 */
export function getDisabledAliases(aliases: EmailAlias[]): EmailAlias[] {
  return aliases.filter((a) => !a.isActive);
}

/**
 * Find alias by email address.
 */
export function findAliasByEmail(aliases: EmailAlias[], email: string): EmailAlias | undefined {
  return aliases.find((a) => a.alias === email);
}

/**
 * Compute alias statistics.
 */
export function computeAliasStats(aliases: EmailAlias[]): AliasStats {
  return {
    total: aliases.length,
    active: aliases.filter((a) => a.isActive).length,
    disabled: aliases.filter((a) => !a.isActive).length,
    totalReceived: aliases.reduce((sum, a) => sum + a.stats.received, 0),
    totalForwarded: aliases.reduce((sum, a) => sum + a.stats.forwarded, 0),
  };
}

/**
 * Check if user can create more aliases.
 */
export function canCreateAlias(
  currentCount: number,
  tier: "free" | "pro" | "admin" = "free"
): boolean {
  return currentCount < ALIAS_LIMITS[tier];
}

/**
 * Get remaining aliases for a tier.
 */
export function getRemainingAliases(
  currentCount: number,
  tier: "free" | "pro" | "admin" = "free"
): number {
  const limit = ALIAS_LIMITS[tier];
  return Math.max(0, limit - currentCount);
}

/**
 * Validate an alias format.
 */
export function isValidAliasFormat(alias: string): boolean {
  const regex = /^[a-z0-9]{6,12}@misfits\.ai$/;
  return regex.test(alias);
}

/**
 * Get the alias domain.
 */
export function getAliasDomain(): string {
  return ALIAS_DOMAIN;
}
