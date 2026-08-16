"use client";

import { useMemo, useReducer, type FormEvent } from "react";
import { useRegister } from "@/hooks/use-auth";
import { buildAvatarOptions, sanitizeAvatarName } from "../_lib/avatar";
import {
  initialRegistrationState,
  registrationReducer,
} from "../_lib/registration-reducer";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function useRegistrationForm() {
  const registerMutation = useRegister();
  const [state, dispatch] = useReducer(
    registrationReducer,
    undefined,
    initialRegistrationState,
  );
  // Placeholder pour éventuel state UI local futur — garde ≤ 3 useState.

  const {
    firstName,
    lastName,
    email,
    password,
    confirmPassword,
    acceptTerms,
    emailTouched,
    confirmTouched,
    termsTouched,
    submitAttempted,
    avatarSalt,
    avatarNameEdits,
    selectedAvatar,
  } = state;

  const avatarOptions = useMemo(
    () => buildAvatarOptions(avatarSalt),
    [avatarSalt],
  );

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
    dispatch({
      type: "REGENERATE_AVATARS",
      salt: avatarSalt + Math.floor(Math.random() * 1_000_000) + 1,
    });
  }

  function updateSelectedAvatarName(next: string) {
    if (!selectedAvatarOption) return;
    dispatch({
      type: "SET_AVATAR_NAME",
      id: selectedAvatarOption.id,
      value: sanitizeAvatarName(next),
    });
  }

  function setTermsAccepted(next: boolean) {
    dispatch({ type: "SET_ACCEPT_TERMS", value: next });
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) {
      dispatch({ type: "MARK_INVALID_SUBMIT", needTerms: !acceptTerms });
      return;
    }
    dispatch({ type: "SET_SUBMIT_ATTEMPTED", value: true });
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
    setFirstName: (v: string) => dispatch({ type: "SET_FIRST_NAME", value: v }),
    lastName,
    setLastName: (v: string) => dispatch({ type: "SET_LAST_NAME", value: v }),
    email,
    setEmail: (v: string) => dispatch({ type: "SET_EMAIL", value: v }),
    password,
    setPassword: (v: string) => dispatch({ type: "SET_PASSWORD", value: v }),
    confirmPassword,
    setConfirmPassword: (v: string) =>
      dispatch({ type: "SET_CONFIRM_PASSWORD", value: v }),
    acceptTerms,
    setTermsAccepted,
    emailTouched,
    setEmailTouched: (v: boolean) =>
      dispatch({ type: "SET_EMAIL_TOUCHED", value: v }),
    confirmTouched,
    setConfirmTouched: (v: boolean) =>
      dispatch({ type: "SET_CONFIRM_TOUCHED", value: v }),
    emailError,
    passwordTooShort,
    passwordMismatch,
    termsError,
    canSubmit,
    avatarOptions,
    selectedAvatar,
    setSelectedAvatar: (v: number) =>
      dispatch({ type: "SET_SELECTED_AVATAR", value: v }),
    avatarNameEdits,
    selectedAvatarName,
    regenerateAvatars,
    updateSelectedAvatarName,
    handleSubmit,
  };
}
