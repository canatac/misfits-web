"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRegister } from "@/hooks/use-auth";
import { buildAvatarOptions, sanitizeAvatarName } from "../_lib/avatar";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function useRegistrationForm() {
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
    [avatarSalt],
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
    setTermsTouched(!next);
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

    void selectedAvatarName;

    registerMutation.mutate({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      password,
      condition_accepted: true,
    });
  }

  return {
    registerMutation,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    acceptTerms,
    setTermsAccepted,
    emailTouched,
    setEmailTouched,
    confirmTouched,
    setConfirmTouched,
    emailError,
    passwordTooShort,
    passwordMismatch,
    termsError,
    canSubmit,
    avatarOptions,
    selectedAvatar,
    setSelectedAvatar,
    avatarNameEdits,
    selectedAvatarName,
    regenerateAvatars,
    updateSelectedAvatarName,
    handleSubmit,
  };
}
