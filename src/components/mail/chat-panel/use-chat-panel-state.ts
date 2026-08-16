"use client";

import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import {
  DEFAULT_ANALYTICS,
  DEFAULT_PERSONA,
  type Analytics,
  type PersonaPreset,
} from "./chat-panel-utils";

export type UiMode = "assistant" | "expert";
export type WorkspaceTab = "ai" | "agenda" | "tasks";

export type TaskItem = {
  id: string;
  text: string;
  done: boolean;
  status: "idle" | "running" | "done" | "failed";
  runId?: string;
};

export type OpsAction = {
  at: number;
  action: string;
  mode: "dry-run" | "execute";
};

export type ChatPanelState = {
  uiMode: UiMode;
  workspaceTab: WorkspaceTab;
  pendingSensitivePrompt: string | null;
  opsDryRun: boolean;
  opsHistory: OpsAction[];
  memoryNote: string;
  taskItems: TaskItem[];
  templateId: string;
  persona: PersonaPreset;
  analytics: Analytics;
  lastRedactionCount: number;
  lastExecError: string | null;
};

export type ChatPanelAction =
  | { type: "setUiMode"; value: UiMode }
  | { type: "setWorkspaceTab"; value: WorkspaceTab }
  | { type: "setPendingSensitivePrompt"; value: string | null }
  | { type: "toggleOpsDryRun" }
  | { type: "pushOpsAction"; value: OpsAction }
  | { type: "setMemoryNote"; value: string }
  | { type: "setTaskItems"; value: TaskItem[] }
  | { type: "setTemplateId"; value: string }
  | { type: "setPersona"; value: PersonaPreset }
  | { type: "setAnalytics"; value: Analytics }
  | { type: "setLastRedactionCount"; value: number }
  | { type: "setLastExecError"; value: string | null };

const INITIAL_STATE: ChatPanelState = {
  uiMode: "assistant",
  workspaceTab: "ai",
  pendingSensitivePrompt: null,
  opsDryRun: true,
  opsHistory: [],
  memoryNote: "",
  taskItems: [],
  templateId: "none",
  persona: DEFAULT_PERSONA,
  analytics: DEFAULT_ANALYTICS,
  lastRedactionCount: 0,
  lastExecError: null,
};

function reducer(state: ChatPanelState, action: ChatPanelAction): ChatPanelState {
  switch (action.type) {
    case "setUiMode":
      return { ...state, uiMode: action.value };
    case "setWorkspaceTab":
      return { ...state, workspaceTab: action.value };
    case "setPendingSensitivePrompt":
      return { ...state, pendingSensitivePrompt: action.value };
    case "toggleOpsDryRun":
      return { ...state, opsDryRun: !state.opsDryRun };
    case "pushOpsAction":
      return {
        ...state,
        opsHistory: [action.value, ...state.opsHistory].slice(0, 20),
      };
    case "setMemoryNote":
      return { ...state, memoryNote: action.value };
    case "setTaskItems":
      return { ...state, taskItems: action.value };
    case "setTemplateId":
      return { ...state, templateId: action.value };
    case "setPersona":
      return { ...state, persona: action.value };
    case "setAnalytics":
      return { ...state, analytics: action.value };
    case "setLastRedactionCount":
      return { ...state, lastRedactionCount: action.value };
    case "setLastExecError":
      return { ...state, lastExecError: action.value };
    default:
      return state;
  }
}

export type StorageKeys = {
  memoryKey: string;
  tasksKey: string;
  personaKey: string;
  analyticsKey: string;
};

export function useChatPanelState(opts: {
  isOpen: boolean;
  storageKeys: StorageKeys;
}) {
  const { isOpen, storageKeys } = opts;
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const [input, setInput] = useState("");
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    const { memoryKey, tasksKey, personaKey, analyticsKey } = storageKeys;

    const savedNote = window.localStorage.getItem(memoryKey) ?? "";
    dispatch({ type: "setMemoryNote", value: savedNote });

    const savedTasks = window.localStorage.getItem(tasksKey);
    if (savedTasks) {
      try {
        dispatch({
          type: "setTaskItems",
          value: JSON.parse(savedTasks) as TaskItem[],
        });
      } catch {
        dispatch({ type: "setTaskItems", value: [] });
      }
    } else {
      dispatch({ type: "setTaskItems", value: [] });
    }

    const savedPersona = window.localStorage.getItem(personaKey);
    if (savedPersona) {
      try {
        dispatch({
          type: "setPersona",
          value: JSON.parse(savedPersona) as PersonaPreset,
        });
      } catch {
        dispatch({ type: "setPersona", value: DEFAULT_PERSONA });
      }
    }

    const savedAnalytics = window.localStorage.getItem(analyticsKey);
    if (savedAnalytics) {
      try {
        dispatch({
          type: "setAnalytics",
          value: JSON.parse(savedAnalytics) as Analytics,
        });
      } catch {
        dispatch({ type: "setAnalytics", value: DEFAULT_ANALYTICS });
      }
    }
  }, [isOpen, storageKeys]);

  const bumpAnalytics = useCallback(
    (patch: Partial<Analytics>) => {
      const current = state.analytics;
      const next = {
        ...current,
        ...Object.fromEntries(
          Object.entries(patch).map(([k, v]) => [
            k,
            ((current as Record<string, number>)[k] ?? 0) + (v ?? 0),
          ])
        ),
      } as Analytics;
      dispatch({ type: "setAnalytics", value: next });
      window.localStorage.setItem(storageKeys.analyticsKey, JSON.stringify(next));
    },
    [state.analytics, storageKeys.analyticsKey]
  );

  const persistTasks = useCallback(
    (next: TaskItem[]) => {
      dispatch({ type: "setTaskItems", value: next });
      window.localStorage.setItem(storageKeys.tasksKey, JSON.stringify(next));
    },
    [storageKeys.tasksKey]
  );

  const persistPersona = useCallback(
    (next: PersonaPreset) => {
      dispatch({ type: "setPersona", value: next });
      window.localStorage.setItem(storageKeys.personaKey, JSON.stringify(next));
    },
    [storageKeys.personaKey]
  );

  const persistMemoryNote = useCallback(
    (value: string) => {
      window.localStorage.setItem(storageKeys.memoryKey, value);
    },
    [storageKeys.memoryKey]
  );

  const clearMemoryNote = useCallback(() => {
    dispatch({ type: "setMemoryNote", value: "" });
    window.localStorage.removeItem(storageKeys.memoryKey);
  }, [storageKeys.memoryKey]);

  return useMemo(
    () => ({
      state,
      dispatch,
      input,
      setInput,
      searchValue,
      setSearchValue,
      bumpAnalytics,
      persistTasks,
      persistPersona,
      persistMemoryNote,
      clearMemoryNote,
    }),
    [
      state,
      input,
      searchValue,
      bumpAnalytics,
      persistTasks,
      persistPersona,
      persistMemoryNote,
      clearMemoryNote,
    ]
  );
}
