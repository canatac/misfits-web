/**
 * Split Inbox utility (Issue #451 + #496).
 *
 * Superhuman-style inbox that automatically classifies emails into
 * "Important" and "Other" sections. Supports manual correction and
 * learning from user feedback.
 */

export interface EmailImportance {
  emailId: string;
  score: number;
  category: 'important' | 'other';
  reasons: string[];
}

export interface SenderScore {
  email: string;
  score: number;
  interactionCount: number;
  lastInteraction: number;
}

export type InboxSection = 'important' | 'other';

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

const IMPORTANT_PATTERNS = [
  /meeting/i,
  /schedule/i,
  /urgent/i,
  /action required/i,
  /deadline/i,
  /please (reply|confirm|review)/i,
  /your (input|response|approval)/i,
];

const LOW_PRIORITY_PATTERNS = [
  /unsubscribe/i,
  /newsletter/i,
  /promotion/i,
  /sale/i,
  /offer/i,
];

export function calculateImportance(
  email: { id: string; from: string; subject: string; body: string; isStarred?: boolean },
  senderScores: Map<string, SenderScore>
): EmailImportance {
  const score = calculateScore(email, senderScores);
  const reasons: string[] = [];

  if (score >= 70) {
    reasons.push('High-priority sender or content');
  }
  if (email.isStarred) {
    reasons.push('Starred by user');
  }
  if (hasImportantPattern(email.subject + ' ' + email.body)) {
    reasons.push('Contains important patterns');
  }
  if (hasLowPriorityPattern(email.subject + ' ' + email.body)) {
    reasons.push('Low-priority content detected');
  }

  return {
    emailId: email.id,
    score,
    category: score >= 50 ? 'important' : 'other',
    reasons,
  };
}

function calculateScore(
  email: { from: string; subject: string; body: string; isStarred?: boolean },
  senderScores: Map<string, SenderScore>
): number {
  let score = 50;

  const senderScore = senderScores.get(email.from.toLowerCase());
  if (senderScore) {
    score += Math.min(senderScore.score, 20);
  }

  if (hasImportantPattern(email.subject)) {
    score += 15;
  }
  if (hasImportantPattern(email.body)) {
    score += 10;
  }
  if (hasLowPriorityPattern(email.subject + email.body)) {
    score -= 20;
  }

  if (email.isStarred) {
    score += 10;
  }

  return Math.max(0, Math.min(100, score));
}

function hasImportantPattern(text: string): boolean {
  return IMPORTANT_PATTERNS.some((p) => p.test(text));
}

function hasLowPriorityPattern(text: string): boolean {
  return LOW_PRIORITY_PATTERNS.some((p) => p.test(text));
}

export function updateSenderScore(
  senderScores: Map<string, SenderScore>,
  sender: string,
  action: 'read' | 'archive' | 'star' | 'reply'
): Map<string, SenderScore> {
  const key = sender.toLowerCase();
  const existing = senderScores.get(key) || {
    email: sender,
    score: 50,
    interactionCount: 0,
    lastInteraction: 0,
  };

  const newScores = new Map(senderScores);
  let scoreDelta = 0;

  switch (action) {
    case 'read':
      scoreDelta = 2;
      break;
    case 'star':
      scoreDelta = 5;
      break;
    case 'reply':
      scoreDelta = 3;
      break;
    case 'archive':
      scoreDelta = -1;
      break;
  }

  newScores.set(key, {
    ...existing,
    email: sender,
    score: Math.max(0, Math.min(100, existing.score + scoreDelta)),
    interactionCount: existing.interactionCount + 1,
    lastInteraction: Date.now(),
  });

  return newScores;
}

export function splitInbox<
  T extends { id: string; from: string; subject: string; body: string; isStarred?: boolean },
>(emails: T[], senderScores: Map<string, SenderScore>): { important: T[]; other: T[] } {
  const result: { important: T[]; other: T[] } = { important: [], other: [] };

  for (const email of emails) {
    const importance = calculateImportance(email, senderScores);
    if (importance.category === 'important') {
      result.important.push(email);
    } else {
      result.other.push(email);
    }
  }

  return result;
}

export function getImportantCount(
  emails: Array<{ id: string; from: string; subject: string; body: string }>,
  senderScores: Map<string, SenderScore>
): number {
  return emails.filter((e) => calculateImportance(e, senderScores).category === 'important').length;
}

export function getDefaultSplitInboxSettings(): SplitInboxSettings {
  return {
    enabled: true,
    autoLearn: true,
    importantThreshold: 0.5,
  };
}

export function createSplitInboxState(): SplitInboxState {
  return {
    important: [],
    other: [],
    classifications: new Map(),
  };
}

export function classifyEmail(
  emailId: string,
  confidence: number,
  threshold: number = 0.5
): ClassifiedEmail {
  return {
    emailId,
    section: confidence >= threshold ? 'important' : 'other',
    confidence,
    classifiedAt: new Date().toISOString(),
    userCorrected: false,
  };
}

export function moveEmailToSection(
  state: SplitInboxState,
  emailId: string,
  targetSection: InboxSection
): SplitInboxState {
  const newImportant = state.important.filter((id) => id !== emailId);
  const newOther = state.other.filter((id) => id !== emailId);

  if (targetSection === 'important') {
    newImportant.push(emailId);
  } else {
    newOther.push(emailId);
  }

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

export function getEmailsInSection(state: SplitInboxState, section: InboxSection): string[] {
  return section === 'important' ? state.important : state.other;
}

export function isEmailInSection(
  state: SplitInboxState,
  emailId: string,
  section: InboxSection
): boolean {
  return section === 'important'
    ? state.important.includes(emailId)
    : state.other.includes(emailId);
}

export function getEmailSection(
  state: SplitInboxState,
  emailId: string
): InboxSection | null {
  if (state.important.includes(emailId)) return 'important';
  if (state.other.includes(emailId)) return 'other';
  return null;
}

export function getClassification(
  state: SplitInboxState,
  emailId: string
): ClassifiedEmail | undefined {
  return state.classifications.get(emailId);
}

export function isUserCorrected(state: SplitInboxState, emailId: string): boolean {
  const classification = state.classifications.get(emailId);
  return classification?.userCorrected ?? false;
}

export function getSectionLabel(section: InboxSection): string {
  const labels: Record<InboxSection, string> = {
    important: 'Important',
    other: 'Other',
  };
  return labels[section];
}

export function getSectionDescription(section: InboxSection): string {
  const descriptions: Record<InboxSection, string> = {
    important: 'Emails requiring your attention',
    other: 'Newsletters, notifications, and low-priority emails',
  };
  return descriptions[section];
}

export function getSectionCount(state: SplitInboxState, section: InboxSection): number {
  return section === 'important' ? state.important.length : state.other.length;
}

export function getTotalCount(state: SplitInboxState): number {
  return state.important.length + state.other.length;
}

export function isSplitInboxEmpty(state: SplitInboxState): boolean {
  return state.important.length === 0 && state.other.length === 0;
}

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

export function clearSplitInbox(state: SplitInboxState): SplitInboxState {
  state.classifications.clear();
  return {
    important: [],
    other: [],
    classifications: state.classifications,
  };
}

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

export function shouldReclassify(state: SplitInboxState, emailId: string): boolean {
  const classification = state.classifications.get(emailId);
  if (!classification) return false;
  return classification.userCorrected;
}
