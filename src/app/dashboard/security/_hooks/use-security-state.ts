"use client";

import { useEffect, useState } from "react";
import {
  defaultAiSettings,
  type AiSettings,
} from "@/types/ai-settings";
import { fetchAiSettings, saveAiSettings } from "@/lib/ai-settings";
import {
  LLM_PROVIDER_OPTIONS,
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
    // Secrets are intentionally memory-only (no browser persistent storage).
    setLlmProvider((prev) =>
      LLM_PROVIDER_OPTIONS.includes(prev) ? prev : "openrouter",
    );

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
    const hasAnyValue = Object.values(mailboxSecrets).some((secret) =>
      [secret.imapLogin, secret.imapPassword, secret.smtpLogin, secret.smtpPassword]
        .map((value) => value.trim())
        .some(Boolean),
    );
    setMailboxFeedback(
      hasAnyValue
        ? "Clés mailbox conservées en mémoire de session (non persistées navigateur)."
        : "Aucune clé mailbox à conserver.",
    );
  }

  async function handleSaveLlmSettings() {
    setLlmSaving(true);
    try {
      const saved = await saveAiSettings({
        defaultModel: aiSettings.defaultModel,
        features: aiSettings.features,
      });
      setAiSettings(saved);
      setLlmFeedback(
        "Configuration LLM sauvegardée côté serveur (secrets conservés en mémoire de session).",
      );
    } catch {
      setLlmFeedback(
        "Échec de sauvegarde des modèles système. Les secrets restent uniquement en mémoire de session.",
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
