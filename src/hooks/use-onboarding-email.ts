const ONBOARDING_KEY = "misfits_onboarding_done";

export interface OnboardingEmail {
  id: string;
  threadId: string;
  folder: "inbox";
  from: { name: string; address: string };
  to: { name: string; address: string }[];
  subject: string;
  preview: string;
  body: string;
  bodyType: "html";
  date: string;
  receivedAt: string;
  isRead: boolean;
  isStarred: boolean;
  isImportant: boolean;
  hasAttachments: boolean;
  attachments: unknown[];
  labels: string[];
  size: number;
  messageId: string;
  isPinned: boolean;
  isOnboarding: boolean;
}

export function createOnboardingEmail(userEmail: string, userName?: string): OnboardingEmail {
  return {
    id: "onboarding-welcome-email",
    threadId: "onboarding-thread",
    folder: "inbox",
    from: { name: "Hermes", address: "hermes@misfits.ai" },
    to: [{ name: userName || "You", address: userEmail }],
    subject: "Welcome to misfits.ai Mail",
    preview: "Your privacy-first email experience starts here.",
    body: "<div><h1>misfits.ai Mail</h1><p>Welcome! Shortcuts: j/k navigate, / search, c compose.</p></div>",
    bodyType: "html",
    date: new Date().toISOString(),
    receivedAt: new Date().toISOString(),
    isRead: false,
    isStarred: false,
    isImportant: true,
    hasAttachments: false,
    attachments: [],
    labels: ["onboarding"],
    size: 2048,
    messageId: "<onboarding-welcome@misfits.ai>",
    isPinned: true,
    isOnboarding: true,
  };
}

export function isOnboardingDone(): boolean {
  if (typeof window === "undefined") return true;
  try { return localStorage.getItem(ONBOARDING_KEY) === "true"; } catch { return true; }
}

export function markOnboardingDone(): void {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(ONBOARDING_KEY, "true"); } catch {}
}
