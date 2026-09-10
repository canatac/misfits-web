/**
 * AI Draft in User Voice (Issue #497).
 *
 * Analyzes user's email history to learn writing style (tone, length, phrases)
 * and generates voice-matched draft responses that sound like the user.
 */

export interface UserStyleProfile {
  userId: string;
  averageLength: number;
  tone: "formal" | "casual" | "friendly" | "direct";
  commonPhrases: string[];
  signaturePhrases: string[];
  greetingStyle: string;
  closingStyle: string;
  sampleSize: number;
  lastUpdated: string;
}

export interface DraftRequest {
  originalEmailId: string;
  originalSubject: string;
  originalBody: string;
  originalSender: string;
  context?: string;
}

export interface DraftResult {
  draftId: string;
  subject: string;
  body: string;
  confidence: number;
  basedOnSamples: number;
  style: UserStyleProfile["tone"];
  generatedAt: string;
}

export interface DraftFeedback {
  draftId: string;
  accepted: boolean;
  modified: boolean;
  finalBody?: string;
  feedbackAt: string;
}

/**
 * Create a default user style profile.
 */
export function createDefaultStyleProfile(userId: string): UserStyleProfile {
  return {
    userId,
    averageLength: 0,
    tone: "friendly",
    commonPhrases: [],
    signaturePhrases: [],
    greetingStyle: "Hi",
    closingStyle: "Best",
    sampleSize: 0,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Analyze user's email history to build style profile.
 */
export function analyzeUserStyle(
  userId: string,
  sentEmails: Array<{ subject: string; body: string }>
): UserStyleProfile {
  if (sentEmails.length === 0) {
    return createDefaultStyleProfile(userId);
  }

  const totalLength = sentEmails.reduce((sum, e) => sum + e.body.length, 0);
  const averageLength = totalLength / sentEmails.length;

  // Detect tone based on common patterns
  const tone = detectTone(sentEmails);

  // Extract common phrases (2-3 word sequences)
  const commonPhrases = extractCommonPhrases(sentEmails.map((e) => e.body));

  // Extract greeting and closing styles
  const greetingStyle = extractGreetingStyle(sentEmails.map((e) => e.body));
  const closingStyle = extractClosingStyle(sentEmails.map((e) => e.body));

  return {
    userId,
    averageLength,
    tone,
    commonPhrases: commonPhrases.slice(0, 10),
    signaturePhrases: extractSignaturePhrases(sentEmails.map((e) => e.body)),
    greetingStyle,
    closingStyle,
    sampleSize: sentEmails.length,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Detect tone from email content.
 */
function detectTone(emails: Array<{ subject: string; body: string }>): UserStyleProfile["tone"] {
  const allText = emails.map((e) => e.body).join(" ").toLowerCase();

  const formalIndicators = ["dear", "sincerely", "regards", "would like", "please find"];
  const casualIndicators = ["hey", "thanks", "cheers", "btw", "lol"];
  const directIndicators = ["let me know", "please confirm", "need by", "deadline"];

  const formalScore = formalIndicators.filter((w) => allText.includes(w)).length;
  const casualScore = casualIndicators.filter((w) => allText.includes(w)).length;
  const directScore = directIndicators.filter((w) => allText.includes(w)).length;

  if (formalScore > casualScore && formalScore > directScore) return "formal";
  if (casualScore > formalScore && casualScore > directScore) return "casual";
  if (directScore > formalScore) return "direct";
  return "friendly";
}

/**
 * Extract common phrases from text.
 */
function extractCommonPhrases(texts: string[]): string[] {
  const phrases: Map<string, number> = new Map();

  for (const text of texts) {
    const words = text.toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/);
    for (let i = 0; i < words.length - 1; i++) {
      const phrase = `${words[i]} ${words[i + 1]}`;
      phrases.set(phrase, (phrases.get(phrase) || 0) + 1);
    }
  }

  return Array.from(phrases.entries())
    .filter(([, count]) => count > 1)
    .sort((a, b) => b[1] - a[1])
    .map(([phrase]) => phrase);
}

/**
 * Extract greeting style.
 */
function extractGreetingStyle(texts: string[]): string {
  const greetings = ["hi", "hello", "hey", "dear", "good morning", "good afternoon"];
  for (const text of texts) {
    const firstLine = text.split("\n")[0]?.toLowerCase() || "";
    for (const greeting of greetings) {
      if (firstLine.includes(greeting)) return greeting;
    }
  }
  return "Hi";
}

/**
 * Extract closing style.
 */
function extractClosingStyle(texts: string[]): string {
  const closings = ["best", "regards", "cheers", "thanks", "sincerely", "talk soon"];
  for (const text of texts) {
    const lastLines = text.split("\n").slice(-3).join(" ").toLowerCase();
    for (const closing of closings) {
      if (lastLines.includes(closing)) return closing;
    }
  }
  return "Best";
}

/**
 * Extract signature phrases.
 */
function extractSignaturePhrases(texts: string[]): string[] {
  const phrases: Map<string, number> = new Map();

  for (const text of texts) {
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 10);
    for (const sentence of sentences) {
      const trimmed = sentence.trim().toLowerCase();
      phrases.set(trimmed, (phrases.get(trimmed) || 0) + 1);
    }
  }

  return Array.from(phrases.entries())
    .filter(([, count]) => count > 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([phrase]) => phrase);
}

/**
 * Generate a voice-matched draft.
 */
export function generateVoiceDraft(
  profile: UserStyleProfile,
  request: DraftRequest
): DraftResult {
  const greeting = profile.greetingStyle;
  const closing = profile.closingStyle;

  // Build draft based on style profile
  let body = `${greeting},\n\n`;

  // Add context-aware opening
  if (profile.tone === "formal") {
    body += `Thank you for your email regarding "${request.originalSubject}". `;
  } else if (profile.tone === "casual") {
    body += `Thanks for reaching out! `;
  } else if (profile.tone === "direct") {
    body += `I've reviewed your message. `;
  } else {
    body += `Thanks for your email! `;
  }

  // Add placeholder for actual response
  body += `[Response based on your communication style]\n\n`;

  // Add closing
  body += `${closing},\n[Your name]`;

  // Calculate confidence based on sample size
  const confidence = Math.min(profile.sampleSize / 50, 1);

  return {
    draftId: `draft-${Date.now()}`,
    subject: `Re: ${request.originalSubject}`,
    body,
    confidence,
    basedOnSamples: profile.sampleSize,
    style: profile.tone,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Record feedback on a draft.
 */
export function recordDraftFeedback(
  draftId: string,
  accepted: boolean,
  modified: boolean,
  finalBody?: string
): DraftFeedback {
  return {
    draftId,
    accepted,
    modified,
    finalBody,
    feedbackAt: new Date().toISOString(),
  };
}

/**
 * Update style profile based on feedback.
 */
export function updateStyleProfileFromFeedback(
  profile: UserStyleProfile,
  feedback: DraftFeedback,
  originalDraft: string,
  finalBody?: string
): UserStyleProfile {
  if (!feedback.accepted) {
    return profile;
  }

  // If user modified the draft, learn from the changes
  if (feedback.modified && finalBody) {
    const newEmails = [
      { subject: "Re: draft", body: finalBody },
    ];
    return analyzeUserStyle(profile.userId, newEmails);
  }

  // If accepted as-is, increase confidence
  return {
    ...profile,
    sampleSize: profile.sampleSize + 1,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Get confidence indicator text.
 */
export function getConfidenceIndicator(confidence: number, sampleSize: number): string {
  if (sampleSize < 5) {
    return "Learning your style...";
  }
  if (confidence >= 0.8) {
    return `High confidence • Based on ${sampleSize}+ emails`;
  }
  if (confidence >= 0.5) {
    return `Medium confidence • Based on ${sampleSize} emails`;
  }
  return `Learning • Based on ${sampleSize} emails`;
}

/**
 * Check if profile has enough samples for reliable drafts.
 */
export function hasEnoughSamples(profile: UserStyleProfile): boolean {
  return profile.sampleSize >= 5;
}

/**
 * Get style description for UI.
 */
export function getStyleDescription(tone: UserStyleProfile["tone"]): string {
  const descriptions: Record<UserStyleProfile["tone"], string> = {
    formal: "Professional and polite",
    casual: "Friendly and relaxed",
    friendly: "Warm and approachable",
    direct: "Concise and to the point",
  };
  return descriptions[tone];
}
