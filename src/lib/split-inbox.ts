/**
 * Split Inbox (Superhuman-style Important vs Other)
 *
 * Automatically categorizes emails into "Important" and "Other" based on:
 * - Sender importance (starred contacts, frequent correspondents)
 * - Email content (action-required patterns, meeting invites)
 * - User behavior (which emails the user reads vs archives)
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

  // Sender importance
  const senderScore = senderScores.get(email.from.toLowerCase());
  if (senderScore) {
    score += Math.min(senderScore.score, 20);
  }

  // Content analysis
  if (hasImportantPattern(email.subject)) {
    score += 15;
  }
  if (hasImportantPattern(email.body)) {
    score += 10;
  }
  if (hasLowPriorityPattern(email.subject + email.body)) {
    score -= 20;
  }

  // Starred bonus
  if (email.isStarred) {
    score += 10;
  }

  return Math.max(0, Math.min(100, score));
}

function hasImportantPattern(text: string): boolean {
  return IMPORTANT_PATTERNS.some(p => p.test(text));
}

function hasLowPriorityPattern(text: string): boolean {
  return LOW_PRIORITY_PATTERNS.some(p => p.test(text));
}

export function updateSenderScore(
  senderScores: Map<string, SenderScore>,
  sender: string,
  action: 'read' | 'archive' | 'star' | 'reply'
): Map<string, SenderScore> {
  const key = sender.toLowerCase();
  const existing = senderScores.get(key) || { email: sender, score: 50, interactionCount: 0, lastInteraction: 0 };

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

export function splitInbox<T extends { id: string; from: string; subject: string; body: string; isStarred?: boolean }>(
  emails: T[],
  senderScores: Map<string, SenderScore>
): { important: T[]; other: T[] } {
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

export function getImportantCount(emails: Array<{ id: string; from: string; subject: string; body: string }>, senderScores: Map<string, SenderScore>): number {
  return emails.filter(e => calculateImportance(e, senderScores).category === 'important').length;
}
