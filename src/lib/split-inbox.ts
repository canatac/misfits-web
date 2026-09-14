/**
 * Split Inbox utility (Issue #496).
 *
 * Superhuman-style inbox that automatically classifies emails into
 * "Important" and "Other" sections. Supports manual correction and
 * learning from user feedback.
 */

export type InboxSection = "important" | "other";

export interface ClassifiedEmail {
  emailId: string;
  section: InboxSection;
  confidence: number;
  classifiedAt: string;
  userCorrected: boolean;
}

export interface SplitInboxSettings {
  enabled: boolean;
  autoLearn: boolean;
  importantThreshold: number;
}

export interface SplitInboxState {
  important: string[];
  other: string[];
  classifications: Map<string, ClassifiedEmail>;
}

/**
 * Create default split inbox settings.
 */
export function getDefaultSplitInboxSettings(): SplitInboxSettings {
  return {
    enabled: true,
    autoLearn: true,
    importantThreshold: 0.5,
  };
}

/**
 * Create initial split inbox state.
 */
export function createSplitInboxState(): SplitInboxState {
  return {
    important: [],
    other: [],
    classifications: new Map(),
  };
}

/**
 * Classify an email into important or other.
 */
export function classifyEmail(
  emailId: string,
  confidence: number,
  threshold: number = 0.5
): ClassifiedEmail {
  return {
    emailId,
    section: confidence >= threshold ? "important" : "other",
    confidence,
    classifiedAt: new Date().toISOString(),
    userCorrected: false,
  };
}

/**
 * Move an email to a different section (user correction).
 */
export function moveEmailToSection(
  state: SplitInboxState,
  emailId: string,
  targetSection: InboxSection
): SplitInboxState {
  // Remove from current section
  const newImportant = state.important.filter((id) => id !== emailId);
  const newOther = state.other.filter((id) => id !== emailId);

  // Add to target section
  if (targetSection === "important") {
    newImportant.push(emailId);
  } else {
    newOther.push(emailId);
  }

  // Update classification
  const classification = state.classifications.get(emailId);
  if (classification) {
    classification.section = targetSection;
    classification.userCorrected = true;
  }

  return {
    important: newImportant,
    other: newOther,
    classifications: state.classifications,
  };
}

/**
 * Get emails in a specific section.
 */
export function getEmailsInSection(
  state: SplitInboxState,
  section: InboxSection
): string[] {
  return section === "important" ? state.important : state.other;
}

/**
 * Check if an email is in a specific section.
 */
export function isEmailInSection(
  state: SplitInboxState,
  emailId: string,
  section: InboxSection
): boolean {
  return section === "important"
    ? state.important.includes(emailId)
    : state.other.includes(emailId);
}

/**
 * Get the section an email belongs to.
 */
export function getEmailSection(
  state: SplitInboxState,
  emailId: string
): InboxSection | null {
  if (state.important.includes(emailId)) return "important";
  if (state.other.includes(emailId)) return "other";
  return null;
}

/**
 * Get classification for an email.
 */
export function getClassification(
  state: SplitInboxState,
  emailId: string
): ClassifiedEmail | undefined {
  return state.classifications.get(emailId);
}

/**
 * Check if a classification was user-corrected.
 */
export function isUserCorrected(
  state: SplitInboxState,
  emailId: string
): boolean {
  const classification = state.classifications.get(emailId);
  return classification?.userCorrected ?? false;
}

/**
 * Get section label for display.
 */
export function getSectionLabel(section: InboxSection): string {
  const labels: Record<InboxSection, string> = {
    important: "Important",
    other: "Other",
  };
  return labels[section];
}

/**
 * Get section description for display.
 */
export function getSectionDescription(section: InboxSection): string {
  const descriptions: Record<InboxSection, string> = {
    important: "Emails requiring your attention",
    other: "Newsletters, notifications, and low-priority emails",
  };
  return descriptions[section];
}

/**
 * Count emails in a section.
 */
export function getSectionCount(
  state: SplitInboxState,
  section: InboxSection
): number {
  return section === "important" ? state.important.length : state.other.length;
}

/**
 * Get total email count.
 */
export function getTotalCount(state: SplitInboxState): number {
  return state.important.length + state.other.length;
}

/**
 * Check if split inbox is empty.
 */
export function isSplitInboxEmpty(state: SplitInboxState): boolean {
  return state.important.length === 0 && state.other.length === 0;
}

/**
 * Remove an email from the split inbox.
 */
export function removeEmailFromSplitInbox(
  state: SplitInboxState,
  emailId: string
): SplitInboxState {
  state.classifications.delete(emailId);
  return {
    important: state.important.filter((id) => id !== emailId),
    other: state.other.filter((id) => id !== emailId),
    classifications: state.classifications,
  };
}

/**
 * Clear all emails from the split inbox.
 */
export function clearSplitInbox(state: SplitInboxState): SplitInboxState {
  state.classifications.clear();
  return {
    important: [],
    other: [],
    classifications: state.classifications,
  };
}

/**
 * Get user correction statistics.
 */
export function getCorrectionStats(state: SplitInboxState): {
  total: number;
  corrected: number;
  correctionRate: number;
} {
  const classifications = Array.from(state.classifications.values());
  const corrected = classifications.filter((c) => c.userCorrected).length;
  const total = classifications.length;

  return {
    total,
    corrected,
    correctionRate: total > 0 ? corrected / total : 0,
  };
}

/**
 * Check if email should be reclassified based on user corrections.
 */
export function shouldReclassify(
  state: SplitInboxState,
  emailId: string
): boolean {
  const classification = state.classifications.get(emailId);
  if (!classification) return false;
  return classification.userCorrected;
}
