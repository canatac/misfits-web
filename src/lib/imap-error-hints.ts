/**
 * Actionable hints for common IMAP LOGIN / server failures.
 *
 * The backend probe streams the raw server error verbatim (e.g. the Gmail
 * "[ALERT] Application-specific password required" line). Instead of leaving
 * the user to decode IMAP jargon, we pattern-match well-known signatures and
 * return a short human-readable diagnosis + a documentation link when available.
 *
 * Add new patterns to the `HINTS` array as more providers surface distinctive
 * error strings. Patterns are matched in order; the first hit wins.
 */

export interface ImapErrorHint {
  /** Short, human-readable diagnosis (fr). */
  title: string;
  /** One-sentence explanation of what to do. */
  description: string;
  /** Optional CTA that opens documentation / provider settings. */
  cta?: { label: string; href: string };
}

interface HintPattern {
  /** Case-insensitive substring or RegExp tested against the raw error. */
  match: string | RegExp;
  hint: ImapErrorHint;
}

const HINTS: HintPattern[] = [
  // ─── Gmail / Google Workspace ────────────────────────────────────────────
  {
    match: /application-specific password required/i,
    hint: {
      title: "Google exige un mot de passe d'application",
      description:
        "Ton compte a la 2FA activée. Génère un mot de passe d'application (16 caractères) et utilise-le ici à la place de ton mot de passe habituel.",
      cta: {
        label: "Générer un mot de passe d'application",
        href: "https://myaccount.google.com/apppasswords",
      },
    },
  },
  {
    match: /web login required/i,
    hint: {
      title: "Google demande une connexion web",
      description:
        "Autorise l'accès depuis une nouvelle app en te connectant une fois via le web, puis retente.",
      cta: {
        label: "Débloquer l'accès",
        href: "https://accounts.google.com/DisplayUnlockCaptcha",
      },
    },
  },

  // ─── Microsoft 365 / Outlook.com ─────────────────────────────────────────
  {
    match: /authenticate failed|LOGIN failed.*(AUTHENTICATIONFAILED)/i,
    hint: {
      title: "Authentification refusée",
      description:
        "Vérifie l'email et le mot de passe. Si le compte est un Microsoft 365 avec 2FA, il te faut un mot de passe d'application ou l'OAuth (pas encore supporté).",
      cta: {
        label: "Créer un mot de passe d'app Microsoft",
        href: "https://account.microsoft.com/security",
      },
    },
  },

  // ─── iCloud ──────────────────────────────────────────────────────────────
  {
    match: /icloud.*password|LOGIN failed.*icloud/i,
    hint: {
      title: "iCloud requiert un mot de passe spécifique",
      description:
        "Apple ne permet pas IMAP avec ton mot de passe iCloud principal. Génère un mot de passe pour app dans les réglages de sécurité Apple ID.",
      cta: {
        label: "Générer sur appleid.apple.com",
        href: "https://appleid.apple.com/account/manage",
      },
    },
  },

  // ─── Yahoo ───────────────────────────────────────────────────────────────
  {
    match: /yahoo.*(password|app)|LOGIN failed.*yahoo/i,
    hint: {
      title: "Yahoo requiert un mot de passe d'application",
      description:
        "Va dans Sécurité du compte Yahoo → 'Générer un mot de passe d'application' et utilise-le ici.",
      cta: {
        label: "Yahoo — mots de passe d'app",
        href: "https://login.yahoo.com/account/security",
      },
    },
  },

  // ─── Réseau / TLS ────────────────────────────────────────────────────────
  {
    match: /tls (handshake|connect) failed|SSL|certificate/i,
    hint: {
      title: "Problème TLS/SSL",
      description:
        "Le handshake TLS a échoué. Vérifie le port (993 pour IMAPS, 143 pour STARTTLS) et le mode de sécurité.",
    },
  },
  {
    match: /tcp connect failed|connection refused|no route to host/i,
    hint: {
      title: "Serveur inaccessible",
      description:
        "Impossible d'ouvrir la connexion TCP. Vérifie l'hôte, le port et ta connexion réseau.",
    },
  },
  {
    match: /resolve failed/i,
    hint: {
      title: "DNS introuvable",
      description:
        "Le nom d'hôte IMAP ne résout pas. Vérifie l'orthographe du serveur (ex: imap.gmail.com).",
    },
  },

  // ─── Fallback générique LOGIN NO ─────────────────────────────────────────
  {
    match: /LOGIN failed/i,
    hint: {
      title: "Login IMAP rejeté",
      description:
        "Le serveur a refusé les identifiants. Recontrôle l'email et le mot de passe.",
    },
  },
];

/**
 * Return the first matching hint for a raw error string, or null if none apply.
 * The console component renders whatever this returns as a callout below the
 * terminal — leaving `null` means no hint (falls back to raw error display).
 */
export function detectImapErrorHint(rawError: string | null | undefined): ImapErrorHint | null {
  if (!rawError) return null;
  for (const { match, hint } of HINTS) {
    if (typeof match === "string") {
      if (rawError.toLowerCase().includes(match.toLowerCase())) return hint;
    } else if (match.test(rawError)) {
      return hint;
    }
  }
  return null;
}
