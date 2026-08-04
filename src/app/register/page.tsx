/**
 * Registration page for misfits.ai Mail.
 *
 * Fields:
 *  1. Prénom
 *  2. Nom
 *  3. Avatar (generated automatically from initials + a colour palette)
 *  4. Mot de passe (with strength indicator)
 *  5. Confirmation du mot de passe
 *  6. Case d'acceptation des conditions
 */

"use client";

import { useState, type FormEvent, type ChangeEvent } from "react";
import Link from "next/link";
import { Mail, RefreshCw, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PasswordStrengthIndicator } from "@/components/password-strength-indicator";
import { useRegister } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ *
 * Avatar generation
 *
 * Algorithm:
 *  1. Derive initials from first + last name (up to 2 letters).
 *  2. Pick a background colour from a curated palette using a simple
 *     hash of the full name so the same person always gets the same
 *     colour, but the user can also click "refresh" to cycle through.
 * ------------------------------------------------------------------ */

const AVATAR_PALETTE = [
  { bg: "#6366f1", fg: "#ffffff" }, // indigo
  { bg: "#8b5cf6", fg: "#ffffff" }, // violet
  { bg: "#ec4899", fg: "#ffffff" }, // pink
  { bg: "#f59e0b", fg: "#ffffff" }, // amber
  { bg: "#10b981", fg: "#ffffff" }, // emerald
  { bg: "#06b6d4", fg: "#ffffff" }, // cyan
  { bg: "#3b82f6", fg: "#ffffff" }, // blue
  { bg: "#ef4444", fg: "#ffffff" }, // red
  { bg: "#84cc16", fg: "#ffffff" }, // lime
  { bg: "#f97316", fg: "#ffffff" }, // orange
];

function nameToHash(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) >>> 0;
  }
  return h;
}

function getInitials(first: string, last: string): string {
  const a = first.trim()[0] ?? "";
  const b = last.trim()[0] ?? "";
  return (a + b).toUpperCase() || "?";
}

function buildAvatarSvg(initials: string, bg: string, fg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">` +
      `<circle cx="40" cy="40" r="40" fill="${bg}"/>` +
      `<text x="40" y="40" dy=".35em" text-anchor="middle" ` +
      `font-family="system-ui,sans-serif" font-size="28" font-weight="600" fill="${fg}">` +
      `${initials}</text></svg>`,
  )}`;
}

interface AvatarConfig {
  initials: string;
  paletteIndex: number;
  dataUrl: string;
}

function deriveAvatar(
  first: string,
  last: string,
  paletteIndex?: number,
): AvatarConfig {
  const initials = getInitials(first, last);
  const name = (first + last).trim();
  const idx =
    paletteIndex !== undefined
      ? paletteIndex
      : name.length > 0
        ? nameToHash(name) % AVATAR_PALETTE.length
        : 0;
  const { bg, fg } = AVATAR_PALETTE[idx];
  return {
    initials,
    paletteIndex: idx,
    dataUrl: buildAvatarSvg(initials, bg, fg),
  };
}

/* ------------------------------------------------------------------ *
 * Validation helpers
 * ------------------------------------------------------------------ */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function fieldError(label: string, value: string): string | null {
  if (!value.trim()) return `${label} est requis.`;
  return null;
}

/* ------------------------------------------------------------------ *
 * Register page
 * ------------------------------------------------------------------ */

export default function RegisterPage() {
  const registerMutation = useRegister();

  /* — form state — */
  const [firstName, setFirstName] = useState("");
  const [firstNameTouched, setFirstNameTouched] = useState(false);

  const [lastName, setLastName] = useState("");
  const [lastNameTouched, setLastNameTouched] = useState(false);

  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);

  const [password, setPassword] = useState("");
  const [passwordTouched, setPasswordTouched] = useState(false);

  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmTouched, setConfirmTouched] = useState(false);

  const [acceptTerms, setAcceptTerms] = useState(false);
  const [termsTouched, setTermsTouched] = useState(false);

  /* — avatar — */
  const [paletteIndex, setPaletteIndex] = useState<number | undefined>(
    undefined,
  );

  const avatar = deriveAvatar(
    firstName,
    lastName,
    paletteIndex !== undefined
      ? paletteIndex
      : (firstName + lastName).trim().length > 0
        ? nameToHash((firstName + lastName).trim()) % AVATAR_PALETTE.length
        : 0,
  );

  function cycleAvatar() {
    setPaletteIndex(
      ((paletteIndex ?? avatar.paletteIndex) + 1) % AVATAR_PALETTE.length,
    );
  }

  /* — derived validation — */
  const firstNameError = firstNameTouched ? fieldError("Prénom", firstName) : null;
  const lastNameError = lastNameTouched ? fieldError("Nom", lastName) : null;
  const emailError =
    emailTouched && (!email.trim() || !EMAIL_RE.test(email.trim()))
      ? "Adresse e-mail invalide."
      : null;
  const passwordError =
    passwordTouched && password.length < 8
      ? "Le mot de passe doit contenir au moins 8 caractères."
      : null;
  const confirmError =
    confirmTouched && confirmPassword !== password
      ? "Les mots de passe ne correspondent pas."
      : null;
  const termsError = termsTouched && !acceptTerms
    ? "Vous devez accepter les conditions."
    : null;

  const isValid =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    EMAIL_RE.test(email.trim()) &&
    password.length >= 8 &&
    confirmPassword === password &&
    acceptTerms;

  /* — submit — */
  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFirstNameTouched(true);
    setLastNameTouched(true);
    setEmailTouched(true);
    setPasswordTouched(true);
    setConfirmTouched(true);
    setTermsTouched(true);

    if (!isValid) return;

    registerMutation.mutate({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      displayName: `${firstName.trim()} ${lastName.trim()}`,
      email: email.trim(),
      password,
      avatarUrl: avatar.dataUrl,
      acceptTerms,
    });
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--color-bg)] px-4 py-12">
      {/* Ambient brand glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 0%, var(--color-brand-200) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 w-full max-w-md">
        {/* Brand header */}
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-brand-500)] shadow-[var(--shadow-lg)]">
            <Mail className="h-7 w-7 text-white" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-fg)]">
              misfits.ai Mail
            </h1>
            <p className="text-sm text-[var(--color-muted-fg)]">
              Créez votre compte
            </p>
          </div>
        </div>

        <Card className="animate-fade-in">
          <CardHeader className="space-y-1">
            <CardTitle>Inscription</CardTitle>
            <CardDescription>
              Remplissez les champs ci-dessous pour créer votre compte.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {/* Prénom + Nom */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Prénom</Label>
                  <Input
                    id="firstName"
                    type="text"
                    autoComplete="given-name"
                    placeholder="Marie"
                    value={firstName}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setFirstName(e.target.value)
                    }
                    onBlur={() => setFirstNameTouched(true)}
                    aria-invalid={firstNameError ? "true" : "false"}
                    aria-describedby={
                      firstNameError ? "firstName-error" : undefined
                    }
                    required
                  />
                  {firstNameError ? (
                    <p
                      id="firstName-error"
                      className="text-xs text-[var(--color-danger-500)]"
                      role="alert"
                    >
                      {firstNameError}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Nom</Label>
                  <Input
                    id="lastName"
                    type="text"
                    autoComplete="family-name"
                    placeholder="Dupont"
                    value={lastName}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setLastName(e.target.value)
                    }
                    onBlur={() => setLastNameTouched(true)}
                    aria-invalid={lastNameError ? "true" : "false"}
                    aria-describedby={
                      lastNameError ? "lastName-error" : undefined
                    }
                    required
                  />
                  {lastNameError ? (
                    <p
                      id="lastName-error"
                      className="text-xs text-[var(--color-danger-500)]"
                      role="alert"
                    >
                      {lastNameError}
                    </p>
                  ) : null}
                </div>
              </div>

              {/* Avatar */}
              <div className="space-y-2">
                <Label>Avatar</Label>
                <div className="flex items-center gap-4">
                  {/* Preview */}
                  <img
                    src={avatar.dataUrl}
                    alt={`Avatar avec les initiales ${avatar.initials}`}
                    className="h-14 w-14 rounded-full"
                    aria-live="polite"
                  />
                  <div className="flex-1">
                    <p className="text-sm text-[var(--color-muted-fg)]">
                      Généré automatiquement à partir de vos initiales.
                    </p>
                    <button
                      type="button"
                      onClick={cycleAvatar}
                      className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-brand-500)] transition hover:underline"
                      aria-label="Changer la couleur de l'avatar"
                    >
                      <RefreshCw className="h-3 w-3" aria-hidden="true" />
                      Changer la couleur
                    </button>
                  </div>
                  {/* Palette swatches */}
                  <div
                    className="flex flex-wrap gap-1"
                    role="group"
                    aria-label="Palette de couleurs"
                  >
                    {AVATAR_PALETTE.map((p, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setPaletteIndex(i)}
                        className={cn(
                          "h-5 w-5 rounded-full border-2 transition",
                          avatar.paletteIndex === i
                            ? "border-[var(--color-fg)] scale-110"
                            : "border-transparent opacity-70 hover:opacity-100",
                        )}
                        style={{ backgroundColor: p.bg }}
                        aria-label={`Couleur ${i + 1}`}
                        aria-pressed={avatar.paletteIndex === i}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Adresse e-mail</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="marie@example.com"
                  value={email}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setEmail(e.target.value)
                  }
                  onBlur={() => setEmailTouched(true)}
                  aria-invalid={emailError ? "true" : "false"}
                  aria-describedby={emailError ? "email-error" : undefined}
                  required
                />
                {emailError ? (
                  <p
                    id="email-error"
                    className="text-xs text-[var(--color-danger-500)]"
                    role="alert"
                  >
                    {emailError}
                  </p>
                ) : null}
              </div>

              {/* Mot de passe */}
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setPassword(e.target.value)
                  }
                  onBlur={() => setPasswordTouched(true)}
                  aria-invalid={passwordError ? "true" : "false"}
                  aria-describedby={
                    passwordError ? "password-error" : "password-help"
                  }
                  required
                />
                <PasswordStrengthIndicator ****** />
                {passwordError ? (
                  <p
                    id="password-error"
                    className="text-xs text-[var(--color-danger-500)]"
                    role="alert"
                  >
                    {passwordError}
                  </p>
                ) : (
                  <p
                    id="password-help"
                    className="text-xs text-[var(--color-muted-fg)]"
                  >
                    Minimum 8 caractères.
                  </p>
                )}
              </div>

              {/* Confirmation du mot de passe */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  Confirmation du mot de passe
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setConfirmPassword(e.target.value)
                    }
                    onBlur={() => setConfirmTouched(true)}
                    aria-invalid={confirmError ? "true" : "false"}
                    aria-describedby={
                      confirmError ? "confirm-error" : undefined
                    }
                    required
                  />
                  {confirmTouched &&
                  confirmPassword.length > 0 &&
                  confirmPassword === password ? (
                    <Check
                      className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-success-500,#10b981)]"
                      aria-hidden="true"
                    />
                  ) : null}
                </div>
                {confirmError ? (
                  <p
                    id="confirm-error"
                    className="text-xs text-[var(--color-danger-500)]"
                    role="alert"
                  >
                    {confirmError}
                  </p>
                ) : null}
              </div>

              {/* Acceptation des conditions */}
              <div className="space-y-1">
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="acceptTerms"
                    checked={acceptTerms}
                    onCheckedChange={(v) => {
                      setAcceptTerms(v === true);
                      setTermsTouched(true);
                    }}
                    aria-describedby={termsError ? "terms-error" : undefined}
                  />
                  <Label
                    htmlFor="acceptTerms"
                    className="text-sm font-normal leading-snug"
                  >
                    J&apos;accepte les{" "}
                    <Link
                      href="/terms"
                      className="text-[var(--color-brand-500)] underline-offset-4 hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      conditions d&apos;utilisation
                    </Link>{" "}
                    et la{" "}
                    <Link
                      href="/privacy"
                      className="text-[var(--color-brand-500)] underline-offset-4 hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      politique de confidentialité
                    </Link>
                    .
                  </Label>
                </div>
                {termsError ? (
                  <p
                    id="terms-error"
                    className="text-xs text-[var(--color-danger-500)]"
                    role="alert"
                  >
                    {termsError}
                  </p>
                ) : null}
              </div>

              <Button
                type="submit"
                className="w-full"
                loading={registerMutation.isPending}
                disabled={registerMutation.isPending}
              >
                Créer mon compte
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-sm text-[var(--color-muted-fg)]">
          Vous avez déjà un compte ?{" "}
          <Link
            href="/login"
            className="text-[var(--color-brand-500)] underline-offset-4 hover:underline"
          >
            Se connecter
          </Link>
        </p>

        <p className="mt-4 text-center text-xs text-[var(--color-muted-fg)]">
          © 2026 misfits.ai — Privacy-first email
        </p>
      </div>
    </main>
  );
}
