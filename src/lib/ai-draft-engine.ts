/**
 * AI Draft Suggestion Engine
 *
 * Provides context-aware email draft suggestions based on:
 * - Email thread history
 * - User's previous responses
 * - Common patterns for similar emails
 */

export interface DraftSuggestion {
  text: string;
  confidence: number;
  tone: 'formal' | 'casual' | 'friendly' | 'concise';
}

export interface EmailContext {
  subject: string;
  from: string;
  body: string;
  threadHistory?: string[];
  folder?: string;
}

const FORMAL_STARTERS = [
  'Thank you for your email regarding',
  'I am writing to follow up on',
  'I wanted to provide an update concerning',
];

const CASUAL_STARTERS = [
  'Hi, just wanted to check in about',
  'Thanks for reaching out!',
  'Quick update on',
];

const FRIENDLY_STARTERS = [
  'Hope you\'re doing well!',
  'Great to hear from you!',
  'Thanks so much for',
];

const CONCISE_RESPONSES = [
  'Confirmed. I\'ll take care of it.',
  'Sounds good, thanks!',
  'Understood. Will follow up shortly.',
  'Got it, thank you.',
];

/**
 * Analyze email context and generate draft suggestions
 */
export function generateDraftSuggestions(context: EmailContext): DraftSuggestion[] {
  const suggestions: DraftSuggestion[] = [];
  const subject = context.subject.toLowerCase();
  const body = context.body.toLowerCase();

  // Meeting-related
  if (subject.includes('meeting') || subject.includes('call') || subject.includes('schedule')) {
    suggestions.push({
      text: 'Would you be available for a meeting this week? I\'m flexible on timing.',
      confidence: 0.85,
      tone: 'formal',
    });
    suggestions.push({
      text: 'Let me know what time works best for you!',
      confidence: 0.75,
      tone: 'casual',
    });
  }

  // Question/request patterns
  if (subject.includes('?') || body.includes('?') || subject.includes('request')) {
    suggestions.push({
      text: 'Thank you for your question. Here\'s what I can share:',
      confidence: 0.8,
      tone: 'formal',
    });
  }

  // Thank you / acknowledgment
  if (subject.includes('thank') || body.includes('thank you') || body.includes('appreciate')) {
    suggestions.push({
      text: 'You\'re welcome! Happy to help.',
      confidence: 0.9,
      tone: 'friendly',
    });
    suggestions.push({
      text: 'My pleasure! Let me know if you need anything else.',
      confidence: 0.85,
      tone: 'friendly',
    });
  }

  // Follow-up patterns
  if (subject.includes('follow up') || subject.includes('following up') || subject.includes('reminder')) {
    suggestions.push({
      text: 'Just wanted to follow up on my previous message. Do you have an update?',
      confidence: 0.88,
      tone: 'concise',
    });
  }

  // Default suggestions if no pattern matched
  if (suggestions.length === 0) {
    suggestions.push(
      {
        text: 'Thank you for your email. I\'ll review and get back to you shortly.',
        confidence: 0.6,
        tone: 'formal',
      },
      {
        text: 'Got it, thanks! I\'ll look into this.',
        confidence: 0.55,
        tone: 'casual',
      },
      {
        text: 'Understood. Will follow up shortly.',
        confidence: 0.5,
        tone: 'concise',
      }
    );
  }

  return suggestions.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
}

/**
 * Get appropriate greeting based on recipient and context
 */
export function getGreeting(from: string, isReply: boolean = false): string {
  const name = from.split('<')[0].trim().split(' ')[0];

  if (isReply) {
    return `Hi ${name},`;
  }
  return `Dear ${name},`;
}

/**
 * Get appropriate sign-off based on tone
 */
export function getSignOff(tone: DraftSuggestion['tone']): string {
  switch (tone) {
    case 'formal':
      return 'Best regards,';
    case 'casual':
      return 'Thanks,';
    case 'friendly':
      return 'Cheers,';
    case 'concise':
      return '—';
    default:
      return 'Best,';
  }
}

/**
 * Summarize email thread into key points
 */
export function summarizeThread(emails: EmailContext[]): string {
  if (emails.length === 0) return '';

  const lastEmail = emails[emails.length - 1];
  const summary = [];

  summary.push(`Subject: ${lastEmail.subject}`);
  summary.push(`From: ${lastEmail.from}`);

  if (emails.length > 1) {
    summary.push(`\nThread has ${emails.length} messages.`);
    summary.push(`Key topics: ${extractTopics(emails).join(', ') || 'general discussion'}`);
  }

  return summary.join('\n');
}

/**
 * Extract main topics from email thread
 */
function extractTopics(emails: EmailContext[]): string[] {
  const topics: Set<string> = new Set();
  const keywords = ['meeting', 'deadline', 'budget', 'proposal', 'review', 'update', 'decision', 'schedule', 'project', 'report'];

  for (const email of emails) {
    const text = `${email.subject} ${email.body}`.toLowerCase();
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        topics.add(keyword);
      }
    }
  }

  return Array.from(topics);
}
