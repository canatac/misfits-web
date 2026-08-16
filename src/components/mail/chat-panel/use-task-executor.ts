"use client";

import type {
  ChatPanelState,
  ChatPanelAction,
  TaskItem,
} from "./use-chat-panel-state";

type Dispatch = React.Dispatch<ChatPanelAction>;

interface Args {
  state: ChatPanelState;
  dispatch: Dispatch;
  taskItems: TaskItem[];
  persistTasks: (items: TaskItem[]) => void;
  bumpAnalytics: (delta: Partial<Record<string, number>>) => void;
  sessionId: string;
  sessionKey: string;
  chatContext: {
    threadId?: string;
    userId?: string;
    currentFolder?: string;
    currentEmailId?: string;
    attachmentNames?: string[];
  };
}

export function useTaskExecutor({
  state,
  dispatch,
  taskItems,
  persistTasks,
  bumpAnalytics,
  sessionId,
  sessionKey,
  chatContext,
}: Args) {
  const { opsDryRun } = state;

  return async function executeTaskOnBackend(taskId: string) {
    dispatch({ type: "setLastExecError", value: null });
    const task = taskItems.find((t) => t.id === taskId);
    if (!task) return;

    persistTasks(
      taskItems.map((t) => (t.id === taskId ? { ...t, status: "running" } : t))
    );

    try {
      const modeHint = opsDryRun ? "DRY-RUN" : "EXECUTE";
      const response = await fetch("/api/hermes/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: `[TASK ${modeHint}] ${task.text}\nContexte: session=${sessionId} user=${sessionKey}. Retourne un plan d'exécution court.`,
          model: "hermes-agent",
          threadId: chatContext.threadId,
          userId: chatContext.userId,
          sessionId,
          sessionKey,
        }),
      });

      if (!response.ok) {
        throw new Error(`Backend task run failed (${response.status})`);
      }

      const data = (await response.json().catch(() => ({}))) as {
        run_id?: string;
        id?: string;
      };
      const runId = data.run_id ?? data.id ?? "n/a";
      bumpAnalytics({ backendTaskRuns: 1 });

      persistTasks(
        taskItems.map((t) =>
          t.id === taskId ? { ...t, status: "done", done: true, runId } : t
        )
      );
    } catch (err) {
      persistTasks(
        taskItems.map((t) => (t.id === taskId ? { ...t, status: "failed" } : t))
      );
      dispatch({
        type: "setLastExecError",
        value: err instanceof Error ? err.message : "Échec exécution backend",
      });
    }
  };
}
