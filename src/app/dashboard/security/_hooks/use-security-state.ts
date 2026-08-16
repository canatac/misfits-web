"use client";

import { useEffect, useState } from "react";
import {
  defaultAiSettings,
  type AiSettings,
} from "@/types/ai-settings";
import { fetchAiSettings, saveAiSettings } from "@/lib/ai-settings";
import {
  LLM_PROVIDER_OPTIONS,
  STORAGE_LLM_KEYS,
  STORAGE_LLM_PROVIDER,
  STORAGE_MAILBOX_KEYS,
  type LlmProvider,
  type LlmSecrets,
  type MailboxSecret,
  type MailboxSecretMap,
} from "../_lib/constants";

export function useSecurityState() {
  const [mailboxSecrets, setMailboxSecrets] = useState<MailboxSecretMap>({});
  const [mailboxFeedback, setMailboxFeedback] = useState<string | null>(null);

  const [llmProvider, setLlmProvider] = useState<LlmProvider>("openrouter");
  const [llmSecrets, setLlmSecrets] = useState<LlmSecrets>({
    openrouter: "",
    openai: "",
    anthropic: "",
    groq: "",
    custom: "",
  });
  const [aiSettings, setAiSettings] = useState<AiSettings>(defaultAiSettings());
  const [llmSaving, setLlmSaving] = useState(false);
  const [llmFeedback, setLlmFeedback] = useState<string | null>(null);

  useEffect(() => {
    try {
      const rawMailbox = window.localStorage.getItem(STORAGE_MAILBOX_KEYS);
      if (rawMailbox) {
        const parsed = JSON.parse(rawMailbox) as MailboxSecretMap;
        setMailboxSecrets(parsed || {});
      }

      const rawLlm = window.localStorage.getItem(STORAGE_LLM_KEYS);
      if (rawLlm) {
        const parsed = JSON.parse(rawLlm) as Partial<LlmSecrets>;
        setLlmSecrets((prev) => ({ ...prev, ...parsed }));
      }

      const rawProvider = window.localStorage.getItem(STORAGE_LLM_PROVIDER);
      if (
        rawProvider &&
        LLM_PROVIDER_OPTIONS.includes(rawProvider as LlmProvider)
      ) {
        setLlmProvider(rawProvider as LlmProvider);
      }
    } catch {
      // ignore malformed local cache
    }

    let mounted = true;
    fetchAiSettings()
      .then((settings) => {
        if (!mounted) return;
        setAiSettings(settings);
      })
      .catch(() => {
        // fallback already handled in client
      });

    return () => {
      mounted = false;
    };
  }, []);

  function upsertMailboxSecret(
    accountId: string,
    patch: Partial<MailboxSecret>,
  ) {
    setMailboxSecrets((prev) => {
      const nextForAccount: MailboxSecret = {
        imapLogin: prev[accountId]?.imapLogin || "",
        imapPassword: prev[accountId]?.imapPassword || "",
        smtpLogin: prev[accountId]?.smtpLogin || "",
        smtpPassword: prev[accountId]?.smtpPassword || "",
        ...patch,
      };
      return { ...prev, [accountId]: nextForAccount };
    });
  }

  function handleSaveMailboxSecrets() {
    try {
      window.localStorage.setItem(
        STORAGE_MAILBOX_KEYS,
        JSON.stringify(mailboxSecrets),
      );
      setMailboxFeedback("Clés et identifiants IMAP/SMTP sauvegardés localement.");
    } catch {
      setMailboxFeedback("Impossible de sauvegarder les clés mailbox localement.");
    }
  }

  async function handleSaveLlmSettings() {
    setLlmSaving(true);
    try {
      window.localStorage.setItem(STORAGE_LLM_KEYS, JSON.stringify(llmSecrets));
      window.localStorage.setItem(STORAGE_LLM_PROVIDER, llmProvider);

      const saved = await saveAiSettings({
        defaultModel: aiSettings.defaultModel,
        features: aiSettings.features,
      });
      setAiSettings(saved);
      setLlmFeedback(
        "Configuration LLM sauvegardée (provider local + modèles système). ",
      );
    } catch {
      setLlmFeedback(
        "Sauvegarde partielle: clés locales OK, mais la sauvegarde des modèles système a échoué.",
      );
    } finally {
      setLlmSaving(false);
    }
  }

  return {
    mailboxSecrets,
    mailboxFeedback,
    upsertMailboxSecret,
    handleSaveMailboxSecrets,
    llmProvider,
    setLlmProvider,
    llmSecrets,
    setLlmSecrets,
    aiSettings,
    setAiSettings,
    llmSaving,
    llmFeedback,
    handleSaveLlmSettings,
  };
}
