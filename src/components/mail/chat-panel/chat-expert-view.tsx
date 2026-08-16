"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TraceTab } from "./parts/chat-expert-view/trace-tab";
import { MemoryTab } from "./parts/chat-expert-view/memory-tab";
import { OpsTab } from "./parts/chat-expert-view/ops-tab";
import type {
  TaskItem,
  OpsAction,
  Analytics,
  TraceEvent,
} from "./parts/chat-expert-view/types";

interface ChatExpertViewProps {
  traceEvents: TraceEvent[];
  traceStats: { info: number; warn: number; error: number };
  onClearTrace: () => void;
  sessionId: string;
  sessionKey: string;
  folderLabel: string;
  onCopySessionContext: () => void;
  persona: { tone: string; length: string; language: string };
  onPersonaChange: (next: { tone: string; length: string; language: string }) => void;
  memoryNote: string;
  onMemoryNoteChange: (value: string) => void;
  onSaveMemoryNote: () => void;
  onClearMemoryNote: () => void;
  taskItems: TaskItem[];
  onToggleTask: (id: string) => void;
  onExecuteTask: (id: string) => void;
  lastExecError: string | null;
  analytics: Analytics;
  lastLatencyMs: number | null;
  isAdmin: boolean;
  opsDryRun: boolean;
  onToggleOpsDryRun: () => void;
  onRunAdminAction: (action: string, prompt: string) => void;
  opsHistory: OpsAction[];
}

export function ChatExpertView(props: ChatExpertViewProps) {
  const [tab, setTab] = useState<"trace" | "memory" | "ops">("trace");
  const { isAdmin, traceEvents, traceStats, onClearTrace } = props;

  return (
    <Tabs
      value={tab}
      onValueChange={(v) => setTab(v as "trace" | "memory" | "ops")}
      className="flex h-full flex-col"
    >
      <TabsList className={`grid w-full ${isAdmin ? "grid-cols-3" : "grid-cols-2"}`}>
        <TabsTrigger value="trace">Exécution</TabsTrigger>
        <TabsTrigger value="memory">Mémoire</TabsTrigger>
        {isAdmin && <TabsTrigger value="ops">Admin Ops</TabsTrigger>}
      </TabsList>

      <TabsContent value="trace" className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
        <TraceTab
          traceEvents={traceEvents}
          traceStats={traceStats}
          onClearTrace={onClearTrace}
        />
      </TabsContent>

      <TabsContent value="memory" className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
        <MemoryTab
          sessionId={props.sessionId}
          sessionKey={props.sessionKey}
          folderLabel={props.folderLabel}
          onCopySessionContext={props.onCopySessionContext}
          persona={props.persona}
          onPersonaChange={props.onPersonaChange}
          memoryNote={props.memoryNote}
          onMemoryNoteChange={props.onMemoryNoteChange}
          onSaveMemoryNote={props.onSaveMemoryNote}
          onClearMemoryNote={props.onClearMemoryNote}
          taskItems={props.taskItems}
          onToggleTask={props.onToggleTask}
          onExecuteTask={props.onExecuteTask}
          lastExecError={props.lastExecError}
          analytics={props.analytics}
          lastLatencyMs={props.lastLatencyMs}
          errorCount={traceStats.error}
        />
      </TabsContent>

      {isAdmin && (
        <TabsContent value="ops" className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
          <OpsTab
            opsDryRun={props.opsDryRun}
            onToggleOpsDryRun={props.onToggleOpsDryRun}
            onRunAdminAction={props.onRunAdminAction}
            opsHistory={props.opsHistory}
          />
        </TabsContent>
      )}
    </Tabs>
  );
}
