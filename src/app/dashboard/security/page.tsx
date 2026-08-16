"use client";

import { useAuthStore } from "@/stores/auth-store";
import { ProfileSection } from "./_components/profile-section";
import { AccessKeysSection } from "./_components/access-keys-section";
import { MailboxSection } from "./_components/mailbox-section";
import { LlmSection } from "./_components/llm-section";
import { useSecurityState } from "./_hooks/use-security-state";

export default function DashboardSecurityPage() {
  const user = useAuthStore((s) => s.user);
  const state = useSecurityState();

  if (!user) {
    return (
      <section className="rounded-2xl border border-[#242427] bg-[#121214] p-6 text-[#E0E0E0]">
        <h1 className="text-xl font-semibold text-white">
          Gestion du Compte & Sécurité
        </h1>
        <p className="mt-2 text-sm text-[#A1A1AA]">
          Aucune session utilisateur active. Merci de vous reconnecter.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-5 text-[#E0E0E0]">
      <div className="rounded-2xl border border-[#242427] bg-[#121214] p-5">
        <h1 className="text-xl font-semibold text-white">
          Gestion du Compte & Sécurité
        </h1>
        <p className="mt-1 text-sm text-[#A1A1AA]">
          Profil, clés d&apos;accès, boîtes agrégées, et configuration LLM.
        </p>
      </div>

      <ProfileSection />
      <AccessKeysSection />
      <MailboxSection
        mailboxSecrets={state.mailboxSecrets}
        upsertMailboxSecret={state.upsertMailboxSecret}
        handleSaveMailboxSecrets={state.handleSaveMailboxSecrets}
        mailboxFeedback={state.mailboxFeedback}
      />
      <LlmSection
        llmProvider={state.llmProvider}
        setLlmProvider={state.setLlmProvider}
        llmSecrets={state.llmSecrets}
        setLlmSecrets={state.setLlmSecrets}
        aiSettings={state.aiSettings}
        setAiSettings={state.setAiSettings}
        llmSaving={state.llmSaving}
        llmFeedback={state.llmFeedback}
        handleSaveLlmSettings={state.handleSaveLlmSettings}
      />
    </section>
  );
}
