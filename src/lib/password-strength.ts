/**
 * Password strength estimation (zxcvbn-lite, dependency-free).
 *
 * A lightweight heuristic that scores password strength 0–4 and returns a
 * human-readable label plus a colour token. We intentionally avoid bundling
 * zxcvbn (140 KB) — this is good enough for the inline indicator; the backend
 * remains the authority on enforceable policy.
 */

export type PasswordStrength = {
  score: 0 | 1 | 2 | 3 | 4;
  label: "Very weak" | "Weak" | "Fair" | "Good" | "Strong";
  /** Tailwind-friendly CSS var token for the strength bar colour. */
  color: string;
  percent: number;
};

const COMMON = new Set([
  "password",
  "123456",
  "qwerty",
  "letmein",
  "admin",
  "welcome",
  "misfits",
]);

export function evaluatePasswordStrength(password: string): PasswordStrength {
  if (!password) {
    return { score: 0, label: "Very weak", color: "var(--color-danger-500)", percent: 0 };
  }

  let score = 0;
  const len = password.length;

  // Length bands
  if (len >= 8) score += 1;
  if (len >= 12) score += 1;
  if (len >= 16) score += 1;

  // Character variety
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;

  // Penalise common passwords and obvious sequences
  if (COMMON.has(password.toLowerCase())) score = 0;
  if (/^(?:0123456789|1234567|abcdef|qwerty)/i.test(password)) score = Math.min(score, 1);

  // Clamp to 0–4
  const clamped = Math.max(0, Math.min(4, score - (len < 8 ? 1 : 0))) as 0 | 1 | 2 | 3 | 4;

  const map: Record<0 | 1 | 2 | 3 | 4, Omit<PasswordStrength, "score">> = {
    0: { label: "Very weak", color: "var(--color-danger-500)", percent: 10 },
    1: { label: "Weak", color: "var(--color-danger-500)", percent: 30 },
    2: { label: "Fair", color: "var(--color-warning-500)", percent: 55 },
    3: { label: "Good", color: "var(--color-success-500)", percent: 80 },
    4: { label: "Strong", color: "var(--color-success-500)", percent: 100 },
  };

  return { score: clamped, ...map[clamped] };
}
