"use client";
// useCrGuide.ts — extracted Sprint 6 from admin-console-page.tsx
// Guided change-request formulation chat (Hermes-backed).

import { useState, type FormEvent, type Dispatch, type SetStateAction } from "react";
import type { CreateChangeRequestInput } from "@/types/admin-ops";

export type ChangeRequestChatField =
  | "problemRoot" | "impact" | "successCriteria" | "rollbackPlan" | "none";

export type ChangeRequestChatMessage = {
  role: "assistant" | "user";
  content: string;
};

export type ChangeRequestGuideDraft = {
  problemRoot: string;
  impact: string;
  successCriteria: string;
  rollbackPlan: string;
};

const CHANGE_REQUEST_GUIDE_ORDER: Array<
  Exclude<ChangeRequestChatField, "none">
> = ["problemRoot", "impact", "successCriteria", "rollbackPlan"];

const CHANGE_REQUEST_GUIDE_LABEL: Record<
  Exclude<ChangeRequestChatField, "none">,
  string
> = {
  problemRoot: "problème racine",
  impact: "impact utilisateur/business",
  successCriteria: "critères de succès mesurables",
  rollbackPlan: "plan de rollback/mitigation"
};

export function useCrGuide(
  newRequest: CreateChangeRequestInput,
  setNewRequest: Dispatch<SetStateAction<CreateChangeRequestInput>>
) {
  const [crGuideDraft, setCrGuideDraft] = useState<ChangeRequestGuideDraft>({
    problemRoot: "",
    impact: "",
    successCriteria: "",
    rollbackPlan: ""
  });
  const [crGuideStepIndex, setCrGuideStepIndex] = useState(0);
  const [crGuideMessages, setCrGuideMessages] = useState<
    ChangeRequestChatMessage[]
  >([
    {
      role: "assistant",
      content:
        "Je t’aide à remplir la change request. Commence par décrire le problème racine (symptôme + cause probable)."
    },
  ]);
  const [crGuideInput, setCrGuideInput] = useState("");
  const [crGuideLoading, setCrGuideLoading] = useState(false);
  const [crGuideError, setCrGuideError] = useState<string | null>(null);

  function applyGuideToForm(nextDraft?: ChangeRequestGuideDraft) {
    const draft = nextDraft ?? crGuideDraft;
    const fusedProblem = [
      draft.problemRoot.trim(),
      draft.impact.trim() && `Impact: ${draft.impact.trim()}`,
    ]
      .filter(Boolean)
      .join("\n\n");

    const fusedOutcome = [
      draft.successCriteria.trim(),
      draft.rollbackPlan.trim() &&
        `Rollback/mitigation: ${draft.rollbackPlan.trim()}`,
    ]
      .filter(Boolean)
      .join("\n\n");

    setNewRequest((prev) => ({
      ...prev,
      problem: fusedProblem || prev.problem,
      desiredOutcome: fusedOutcome || prev.desiredOutcome
    }));
  }

  function parseGuideResponse(raw: string): {
    assistantReply?: string;
    field?: ChangeRequestChatField;
    fieldValue?: string;
    nextQuestion?: string;
  } {
    const cleaned = raw
      .trim()
      .replace(/^```json\s*/i, "")
      .replace(/```$/i, "");
    try {
      return JSON.parse(cleaned) as {
        assistantReply?: string;
        field?: ChangeRequestChatField;
        fieldValue?: string;
        nextQuestion?: string;
      };
    } catch {
      return { assistantReply: raw };
    }
  }

  async function handleGuideChatSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const prompt = crGuideInput.trim();
    if (!prompt || crGuideLoading) return;

    const field =
      CHANGE_REQUEST_GUIDE_ORDER[
        Math.min(crGuideStepIndex, CHANGE_REQUEST_GUIDE_ORDER.length - 1)
      ];

    setCrGuideError(null);
    setCrGuideInput("");
    setCrGuideMessages((prev) => [...prev, { role: "user", content: prompt }]);
    setCrGuideLoading(true);

    try {
      const response = await fetch("/api/hermes/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content:
                'Tu es assistant de formulation de change request. Réponds strictement en JSON sans markdown: {"assistantReply":string,"field":"problemRoot"|"impact"|"successCriteria"|"rollbackPlan"|"none","fieldValue":string,"nextQuestion":string}. fieldValue doit reformuler la réponse utilisateur en version exploitable et concise. nextQuestion doit poser la prochaine question utile pour compléter le formulaire.'
            },
            {
              role: "user",
              content: JSON.stringify({
                currentField: field,
                userMessage: prompt,
                draft: crGuideDraft,
                form: newRequest,
                remainingFields: CHANGE_REQUEST_GUIDE_ORDER.slice(
                  Math.min(
                    crGuideStepIndex + 1,
                    CHANGE_REQUEST_GUIDE_ORDER.length
                  )
                ).map((k) => CHANGE_REQUEST_GUIDE_LABEL[k])
              })
            },
          ],
          sessionId: "admin-change-request-guide",
          sessionKey: "misfits-admin-change-request-guide",
          temperature: 0.2
        })
      });

      if (!response.ok) {
        throw new Error(`guide_chat_failed_${response.status}`);
      }

      const data = await response.json();
      const raw =
        data?.choices?.[0]?.message?.content ??
        data?.content ??
        "Réponse indisponible.";

      const parsed = parseGuideResponse(
        typeof raw === "string" ? raw : JSON.stringify(raw)
      );

      const targetField =
        parsed.field && parsed.field !== "none" ? parsed.field : field;
      const normalized = (parsed.fieldValue || prompt).trim();
      const updatedDraft: ChangeRequestGuideDraft = {
        ...crGuideDraft,
        [targetField]: normalized
      };

      setCrGuideDraft(updatedDraft);

      setCrGuideStepIndex((prev) =>
        Math.min(prev + 1, CHANGE_REQUEST_GUIDE_ORDER.length)
      );

      applyGuideToForm(updatedDraft);

      const reply =
        parsed.assistantReply ||
        `Bien reçu pour ${CHANGE_REQUEST_GUIDE_LABEL[targetField]}.`;
      const next =
        parsed.nextQuestion ||
        (crGuideStepIndex + 1 >= CHANGE_REQUEST_GUIDE_ORDER.length
          ? "Parfait, on a les éléments clés. Clique sur “Appliquer au formulaire” puis soumets la request."
          : "Continue avec le prochain point pour compléter la request.");

      setCrGuideMessages((prev) => [
        ...prev,
        { role: "assistant", content: `${reply}\n\n${next}` },
      ]);
    } catch (error) {
      setCrGuideError(
        error instanceof Error ? error.message : "assistant_chat_unavailable"
      );

      const fallbackDraft: ChangeRequestGuideDraft = {
        ...crGuideDraft,
        [field]: prompt
      };
      setCrGuideDraft(fallbackDraft);
      setCrGuideStepIndex((prev) =>
        Math.min(prev + 1, CHANGE_REQUEST_GUIDE_ORDER.length)
      );
      setCrGuideMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Je n’ai pas pu reformuler automatiquement cette réponse. Je l’ai quand même prise en compte, tu peux continuer."
        },
      ]);
      applyGuideToForm(fallbackDraft);
    } finally {
      setCrGuideLoading(false);
    }
  }

  return {
    crGuideDraft,
    crGuideStepIndex,
    crGuideMessages,
    crGuideInput,
    setCrGuideInput,
    crGuideLoading,
    crGuideError,
    applyGuideToForm,
    handleGuideChatSubmit,
  };
}
