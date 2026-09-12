/**
 * Privacy Dashboard (Issue #474).
 *
 * Data transparency — collect, structure, and expose user-facing privacy
 * information: data retention periods, third-party access, account data
 * inventory, and consent status. Provides the data layer for the privacy
 * dashboard UI.
 */

/** Data retention categories for transparency display. */
export interface DataRetentionItem {
  /** Category label. */
  category: string;
  /** Retention period description. */
  retention: string;
  /** Whether the user can manually delete this data. */
  userDeletable: boolean;
  /** Approximate record count (null = unknown). */
  recordCount: number | null;
  /** ISO date of last access (null = not accessed). */
  lastAccessed: string | null;
}

/** Third-party service that processes user data. */
export interface ThirdPartyService {
  /** Service name. */
  name: string;
  /** Purpose of data sharing. */
  purpose: string;
  /** Data types shared. */
  dataTypes: string[];
  /** Whether the user can revoke access. */
  revocable: boolean;
  /** Service privacy policy URL. */
  privacyUrl?: string;
}

/** Consent preference record. */
export interface ConsentPreference {
  /** Consent id. */
  id: string;
  /** Human-readable label. */
  label: string;
  /** Description of what this controls. */
  description: string;
  /** Whether consent is currently granted. */
  granted: boolean;
  /** Whether consent is required (cannot be revoked). */
  required: boolean;
}

/** Aggregated privacy overview for the dashboard. */
export interface PrivacyOverview {
  /** Data retention items by category. */
  retention: DataRetentionItem[];
  /** Third-party services with data access. */
  thirdParties: ThirdPartyService[];
  /** Consent preferences. */
  consents: ConsentPreference[];
  /** Total estimated data footprint in bytes (null = unknown). */
  totalDataSize: number | null;
  /** ISO date of last privacy audit. */
  lastAuditDate: string | null;
}

/** Default data retention policy. */
export const DEFAULT_RETENTION: DataRetentionItem[] = [
  {
    category: "Emails",
    retention: "Until manually deleted",
    userDeletable: true,
    recordCount: null,
    lastAccessed: null,
  },
  {
    category: "Contacts",
    retention: "Until manually deleted",
    userDeletable: true,
    recordCount: null,
    lastAccessed: null,
  },
  {
    category: "Calendar events",
    retention: "Until manually deleted",
    userDeletable: true,
    recordCount: null,
    lastAccessed: null,
  },
  {
    category: "Search history",
    retention: "90 days",
    userDeletable: true,
    recordCount: null,
    lastAccessed: null,
  },
  {
    category: "AI summaries",
    retention: "30 days",
    userDeletable: false,
    recordCount: null,
    lastAccessed: null,
  },
  {
    category: "Login sessions",
    retention: "180 days",
    userDeletable: false,
    recordCount: null,
    lastAccessed: null,
  },
];

/** Default third-party services declaration. */
export const DEFAULT_THIRD_PARTIES: ThirdPartyService[] = [
  {
    name: "OpenAI",
    purpose: "AI-powered email summaries and suggestions",
    dataTypes: ["Email subjects", "Email bodies (partial)"],
    revocable: true,
    privacyUrl: "https://openai.com/privacy",
  },
  {
    name: "Postmark",
    purpose: "Transactional email delivery",
    dataTypes: ["Email addresses", "Delivery status"],
    revocable: false,
    privacyUrl: "https://postmarkapp.com/privacy-policy",
  },
];

/** Default consent preferences. */
export const DEFAULT_CONSENTS: ConsentPreference[] = [
  {
    id: "ai-processing",
    label: "AI Email Processing",
    description: "Allow AI to read and summarize your emails for smart features.",
    granted: true,
    required: false,
  },
  {
    id: "analytics",
    label: "Usage Analytics",
    description: "Anonymous usage data to improve product experience.",
    granted: true,
    required: false,
  },
  {
    id: "marketing",
    label: "Marketing Communications",
    description: "Receive product updates and newsletter.",
    granted: false,
    required: false,
  },
  {
    id: "core-service",
    label: "Core Email Service",
    description: "Required for email delivery and storage. Cannot be disabled.",
    granted: true,
    required: true,
  },
];

/**
 * Build a complete privacy overview.
 *
 * Merges defaults with any user-specific overrides (from API).
 * When no overrides are provided, returns the base transparency declaration.
 *
 * @param overrides Partial overrides from backend.
 * @returns Aggregated privacy overview.
 */
export function buildPrivacyOverview(
  overrides: {
    retention?: DataRetentionItem[];
    thirdParties?: ThirdPartyService[];
    consents?: ConsentPreference[];
    totalDataSize?: number | null;
    lastAuditDate?: string | null;
  } = {}
): PrivacyOverview {
  return {
    retention: overrides.retention ?? DEFAULT_RETENTION,
    thirdParties: overrides.thirdParties ?? DEFAULT_THIRD_PARTIES,
    consents: overrides.consents ?? DEFAULT_CONSENTS,
    totalDataSize: overrides.totalDataSize ?? null,
    lastAuditDate: overrides.lastAuditDate ?? null,
  };
}

/**
 * Toggle a consent preference by id.
 *
 * Returns a new array with the matching item toggled.
 * Required consents are left unchanged.
 *
 * @param consents Current consent list.
 * @param id Consent id to toggle.
 * @param granted New consent state.
 * @returns Updated consent list.
 */
export function toggleConsent(
  consents: ConsentPreference[],
  id: string,
  granted: boolean
): ConsentPreference[] {
  return consents.map((c) => {
    if (c.id !== id) return c;
    if (c.required) return c; // Cannot change required consent
    return { ...c, granted };
  });
}

/**
 * Get only the deletable data categories.
 *
 * @param overview Privacy overview.
 * @returns Categories the user can delete.
 */
export function getDeletableCategories(overview: PrivacyOverview): DataRetentionItem[] {
  return overview.retention.filter((r) => r.userDeletable);
}

/**
 * Get revocable third-party services.
 *
 * @param overview Privacy overview.
 * @returns Services with revocable access.
 */
export function getRevocableServices(overview: PrivacyOverview): ThirdPartyService[] {
  return overview.thirdParties.filter((s) => s.revocable);
}

/**
 * Count granted vs total consents.
 *
 * @param consents Consent list.
 * @returns Summary counts.
 */
export function summarizeConsents(consents: ConsentPreference[]): {
  granted: number;
  total: number;
  requiredGranted: number;
} {
  const granted = consents.filter((c) => c.granted).length;
  const requiredGranted = consents.filter((c) => c.required && c.granted).length;
  return { granted, total: consents.length, requiredGranted };
}
