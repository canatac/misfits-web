"use client";

import Link from "next/link";
import { Mail, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRegistrationForm } from "./_hooks/use-registration-form";
import { ErrorBanner } from "./_components/error-banner";
import { AvatarPicker } from "./_components/avatar-picker";
import {
  IdentityFields,
  PasswordFields,
  TermsField,
} from "./_components/form-fields";

export default function RegisterPage() {
  const f = useRegistrationForm();

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
            {f.registerMutation.isError ? (
              <ErrorBanner
                message={
                  f.registerMutation.error instanceof Error
                    ? f.registerMutation.error.message
                    : "Registration failed. Please try again."
                }
              />
            ) : null}

            <form onSubmit={f.handleSubmit} className="space-y-4" noValidate>
              <IdentityFields
                firstName={f.firstName}
                setFirstName={f.setFirstName}
                lastName={f.lastName}
                setLastName={f.setLastName}
                email={f.email}
                setEmail={f.setEmail}
                emailError={f.emailError}
                setEmailTouched={f.setEmailTouched}
              />

              <AvatarPicker
                avatarOptions={f.avatarOptions}
                selectedAvatar={f.selectedAvatar}
                setSelectedAvatar={f.setSelectedAvatar}
                avatarNameEdits={f.avatarNameEdits}
                selectedAvatarName={f.selectedAvatarName}
                regenerateAvatars={f.regenerateAvatars}
                updateSelectedAvatarName={f.updateSelectedAvatarName}
              />

              <PasswordFields
                password={f.password}
                setPassword={f.setPassword}
                confirmPassword={f.confirmPassword}
                setConfirmPassword={f.setConfirmPassword}
                passwordTooShort={f.passwordTooShort}
                passwordMismatch={f.passwordMismatch}
                setConfirmTouched={f.setConfirmTouched}
              />

              <TermsField
                acceptTerms={f.acceptTerms}
                setTermsAccepted={f.setTermsAccepted}
                termsError={f.termsError}
              />

              <Button
                type="submit"
                className="w-full"
                loading={f.registerMutation.isPending}
                disabled={!f.canSubmit}
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
