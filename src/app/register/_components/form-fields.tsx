"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { PasswordStrengthIndicator } from "@/components/password-strength-indicator";

export function IdentityFields({
  firstName,
  setFirstName,
  lastName,
  setLastName,
  email,
  setEmail,
  emailError,
  setEmailTouched,
}: {
  firstName: string;
  setFirstName: (v: string) => void;
  lastName: string;
  setLastName: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  emailError: boolean;
  setEmailTouched: (v: boolean) => void;
}) {
  return (
    <>
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
          aria-describedby={emailError ? "register-email-error" : undefined}
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
    </>
  );
}

export function PasswordFields({
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  passwordTooShort,
  passwordMismatch,
  setConfirmTouched,
}: {
  password: string;
  setPassword: (v: string) => void;
  confirmPassword: string;
  setConfirmPassword: (v: string) => void;
  passwordTooShort: boolean;
  passwordMismatch: boolean;
  setConfirmTouched: (v: boolean) => void;
}) {
  return (
    <>
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
        <Label htmlFor="register-confirm">Confirmation du mot de passe</Label>
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
    </>
  );
}

export function TermsField({
  acceptTerms,
  setTermsAccepted,
  termsError,
}: {
  acceptTerms: boolean;
  setTermsAccepted: (v: boolean) => void;
  termsError: boolean;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-start gap-2">
        <Checkbox
          id="accept-terms"
          checked={acceptTerms}
          onCheckedChange={(v) => setTermsAccepted(v === true)}
          aria-invalid={termsError ? "true" : "false"}
          aria-describedby={termsError ? "accept-terms-error" : undefined}
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
  );
}
