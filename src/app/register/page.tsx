"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, AlertTriangle } from "lucide-react";

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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const AVATAR_PALETTES = [
  ["#22c55e", "#0ea5e9"],
  ["#f97316", "#ef4444"],
  ["#3b82f6", "#14b8a6"],
  ["#eab308", "#f97316"],
  ["#06b6d4", "#6366f1"],
  ["#84cc16", "#14b8a6"],
  ["#f43f5e", "#8b5cf6"],
  ["#10b981", "#22c55e"],
  ["#0ea5e9", "#2563eb"],
  ["#ef4444", "#f59e0b"],
] as const;

type AvatarOption = {
  id: string;
  name: string;
  background: string;
};

const SYLLABLE_ONSETS = [
  "b",
  "c",
  "d",
  "f",
  "g",
  "k",
  "l",
  "m",
  "n",
  "p",
  "r",
  "s",
  "t",
  "v",
  "z",
] as const;

const SYLLABLE_VOWELS = ["a", "e", "i", "o", "u", "ai", "ou"] as const;

const SYLLABLE_CODAS = ["", "n", "r", "s", "m", "l"] as const;

function hashText(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function initialsFromName(name: string): string {
  const normalized = name.trim().toLowerCase();
  if (!normalized) return "UA";

  const parts = normalized.split(/[-\s]+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]?.toUpperCase() ?? "U"}${parts[1][0]?.toUpperCase() ?? "A"}`;
  }

  const one = parts[0] ?? normalized;
  const first = one[0]?.toUpperCase() ?? "U";
  const second = one[1]?.toUpperCase() ?? "A";
  return `${first}${second}`;
}

function makeRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s += 0x6d2b79f5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function createPseudoWord(seed: number, syllables: 1 | 2): string {
  const rng = makeRng(seed);
  let word = "";

  for (let i = 0; i < syllables; i += 1) {
    const onset = SYLLABLE_ONSETS[Math.floor(rng() * SYLLABLE_ONSETS.length)];
    const vowel = SYLLABLE_VOWELS[Math.floor(rng() * SYLLABLE_VOWELS.length)];
    const coda = SYLLABLE_CODAS[Math.floor(rng() * SYLLABLE_CODAS.length)];
    word += `${onset}${vowel}${coda}`;
  }

  const shortened = word
    .replace(/[^a-z]/g, "")
    .replace(/(.)\1{2,}/g, "$1$1")
    .slice(0, 6);

  if (shortened.length >= 3) return shortened;
  return `${shortened}a`.slice(0, 3);
}

function sanitizeAvatarName(input: string): string {
  const sanitized = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-_]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 16);

  return sanitized || "user-avatar";
}

function buildAvatarOptions(salt: number): AvatarOption[] {
  const seedBase = `avatar-${salt}`;
  const baseHash = hashText(seedBase || "avatar");

  const usedNames = new Set<string>();

  return Array.from({ length: 6 }, (_, i) => {
    const idx = (baseHash + i * 13) % AVATAR_PALETTES.length;
    const [c1, c2] = AVATAR_PALETTES[idx];

    let step = 0;
    let generatedName = "user-avatar";
    while (step < 50) {
      const leftSeed = hashText(`${baseHash}-${i}-${step}-left`);
      const rightSeed = hashText(`${baseHash}-${i}-${step}-right`);
      const left = createPseudoWord(leftSeed, leftSeed % 2 === 0 ? 1 : 2);
      const right = createPseudoWord(rightSeed, rightSeed % 2 === 0 ? 1 : 2);
      generatedName = sanitizeAvatarName(`${left}-${right}`);
      if (!usedNames.has(generatedName)) break;
      step += 1;
    }
    usedNames.add(generatedName);

    return {
      id: `avatar-slot-${i}`,
      name: generatedName,
      background: `linear-gradient(135deg, ${c1}, ${c2})`,
    };
  });
}

export default function RegisterPage() {
  const registerMutation = useRegister();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);

  const [emailTouched, setEmailTouched] = useState(false);
  const [confirmTouched, setConfirmTouched] = useState(false);
  const [termsTouched, setTermsTouched] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [avatarSalt, setAvatarSalt] = useState(() => Date.now());
  const [avatarNameEdits, setAvatarNameEdits] = useState<
    Record<string, string>
  >({});

  const avatarOptions = useMemo(
    () => buildAvatarOptions(avatarSalt),
    [avatarSalt]
  );
  const [selectedAvatar, setSelectedAvatar] = useState(0);

  const selectedAvatarOption =
    avatarOptions[selectedAvatar] ?? avatarOptions[0];
  const selectedAvatarName = selectedAvatarOption
    ? (avatarNameEdits[selectedAvatarOption.id] ?? selectedAvatarOption.name)
    : "user-avatar";

  const emailValid = EMAIL_RE.test(email.trim());
  const emailError = emailTouched && !emailValid && email.length > 0;
  const passwordTooShort = password.length > 0 && password.length < 8;
  const passwordMismatch =
    confirmTouched && password.length > 0 && password !== confirmPassword;
  const termsError = (termsTouched || submitAttempted) && !acceptTerms;

  const canSubmit =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    password.length >= 8 &&
    password === confirmPassword &&
    acceptTerms &&
    !registerMutation.isPending;

  function regenerateAvatars() {
    setAvatarSalt((prev) => prev + Math.floor(Math.random() * 1_000_000) + 1);
    setAvatarNameEdits({});
    setSelectedAvatar(0);
  }

  function updateSelectedAvatarName(next: string) {
    if (!selectedAvatarOption) return;
    setAvatarNameEdits((prev) => ({
      ...prev,
      [selectedAvatarOption.id]: sanitizeAvatarName(next),
    }));
  }

  function setTermsAccepted(next: boolean) {
    setAcceptTerms(next);
    if (next) {
      setTermsTouched(false);
    } else {
      setTermsTouched(true);
    }
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitAttempted(true);

    if (!canSubmit) {
      setEmailTouched(true);
      setConfirmTouched(true);
      if (!acceptTerms) setTermsTouched(true);
      return;
    }

    // Avatar selection is client-only metadata.
    void selectedAvatarName;

    registerMutation.mutate({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      password,
      condition_accepted: true,
    });
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--color-bg)] px-4 py-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 0%, var(--color-brand-200) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-brand-500)] shadow-[var(--shadow-lg)]">
            <Mail className="h-7 w-7 text-white" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-fg)]">
              misfits.ai Mail
            </h1>
            <p className="text-sm text-[var(--color-muted-fg)]">
              Create your account
            </p>
          </div>
        </div>

        <Card className="animate-fade-in">
          <CardHeader className="space-y-1">
            <CardTitle>Get started</CardTitle>
            <CardDescription>
              Complete your profile and create your account.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {registerMutation.isError ? (
              <ErrorBanner
                message={
                  registerMutation.error instanceof Error
                    ? registerMutation.error.message
                    : "Registration failed. Please try again."
                }
              />
            ) : null}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="first-name">Prenom</Label>
                  <Input
                    id="first-name"
                    type="text"
                    autoComplete="given-name"
                    placeholder="Alex"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last-name">Nom</Label>
                  <Input
                    id="last-name"
                    type="text"
                    autoComplete="family-name"
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-email">Email</Label>
                <Input
                  id="register-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setEmailTouched(true)}
                  aria-invalid={emailError ? "true" : "false"}
                  aria-describedby={
                    emailError ? "register-email-error" : undefined
                  }
                  required
                />
                {emailError ? (
                  <p
                    id="register-email-error"
                    className="text-xs text-[var(--color-danger-500)]"
                    role="alert"
                  >
                    Please enter a valid email address.
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label>Avatar</Label>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-8 px-3 text-xs"
                    onClick={regenerateAvatars}
                  >
                    Regenerer
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                  {avatarOptions.map((option, idx) => (
                    <div key={option.id} className="space-y-1 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedAvatar(idx)}
                        className={cn(
                          "mx-auto flex h-11 w-11 items-center justify-center rounded-full text-sm font-semibold text-white transition",
                          selectedAvatar === idx
                            ? "ring-2 ring-[var(--color-brand-500)] ring-offset-2 ring-offset-[var(--color-bg)]"
                            : "opacity-80 hover:opacity-100"
                        )}
                        style={{ background: option.background }}
                        aria-label={`Select avatar ${option.name}`}
                        aria-pressed={selectedAvatar === idx}
                      >
                        {initialsFromName(
                          avatarNameEdits[option.id] ?? option.name
                        )}
                      </button>
                      <p className="truncate text-[10px] text-[var(--color-muted-fg)]">
                        {avatarNameEdits[option.id] ?? option.name}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="avatar-name">
                    Nom d&apos;avatar (editable)
                  </Label>
                  <Input
                    id="avatar-name"
                    type="text"
                    value={selectedAvatarName}
                    onChange={(e) => updateSelectedAvatarName(e.target.value)}
                    placeholder="stellar-rabbit"
                    maxLength={30}
                    autoCapitalize="none"
                    spellCheck={false}
                  />
                </div>
                <p className="text-xs text-[var(--color-muted-fg)]">
                  Suggestions are generated on the fly and can be edited.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-password">Mot de passe</Label>
                <Input
                  id="register-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={passwordTooShort ? "true" : "false"}
                  aria-describedby="register-password-help"
                  required
                  minLength={8}
                />
                <PasswordStrengthIndicator password={password} />
                {passwordTooShort ? (
                  <p
                    id="register-password-help"
                    className="text-xs text-[var(--color-danger-500)]"
                    role="alert"
                  >
                    Password must be at least 8 characters.
                  </p>
                ) : (
                  <p
                    id="register-password-help"
                    className="text-xs text-[var(--color-muted-fg)]"
                  >
                    Use at least 8 characters with a mix of letters, numbers and
                    symbols.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-confirm">
                  Confirmation du mot de passe
                </Label>
                <Input
                  id="register-confirm"
                  type="password"
                  autoComplete="new-password"
                  placeholder="********"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onBlur={() => setConfirmTouched(true)}
                  aria-invalid={passwordMismatch ? "true" : "false"}
                  aria-describedby={
                    passwordMismatch ? "register-confirm-error" : undefined
                  }
                  required
                />
                {passwordMismatch ? (
                  <p
                    id="register-confirm-error"
                    className="text-xs text-[var(--color-danger-500)]"
                    role="alert"
                  >
                    Passwords do not match.
                  </p>
                ) : null}
              </div>

              <div className="space-y-1">
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="accept-terms"
                    checked={acceptTerms}
                    onCheckedChange={(v) => setTermsAccepted(v === true)}
                    aria-invalid={termsError ? "true" : "false"}
                    aria-describedby={
                      termsError ? "accept-terms-error" : undefined
                    }
                  />
                  <Label
                    htmlFor="accept-terms"
                    className="cursor-pointer text-sm leading-5 font-normal"
                  >
                    J&apos;accepte les conditions d&apos;utilisation.
                  </Label>
                </div>
                {termsError ? (
                  <p
                    id="accept-terms-error"
                    className="text-xs text-[var(--color-danger-500)]"
                    role="alert"
                  >
                    Vous devez accepter les conditions d&apos;utilisation.
                  </p>
                ) : null}
              </div>

              <Button
                type="submit"
                className="w-full"
                loading={registerMutation.isPending}
                disabled={!canSubmit}
              >
                Create account
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-sm text-[var(--color-muted-fg)]">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-[var(--color-brand-500)] underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>

        <p className="mt-4 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs text-[var(--color-muted-fg)] underline-offset-4 hover:text-[var(--color-fg)] hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Back to sign in
          </Link>
        </p>
      </div>
    </main>
  );
}

function ErrorBanner({
  message,
  className,
  ...rest
}: {
  message: string;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "mb-4 flex items-start gap-2 rounded-[var(--radius-md)] border border-[var(--color-danger-500)] bg-[var(--color-danger-50)] p-3 text-sm text-[var(--color-danger-700)] dark:bg-[var(--color-danger-900)] dark:text-[var(--color-danger-300)]",
        className
      )}
      role="alert"
      aria-live="assertive"
      {...rest}
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
