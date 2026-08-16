"use client";

import { CalendarClock, ListTodo } from "lucide-react";
import type { Email } from "@/types/email";
import type { TaskItem } from "./use-chat-panel-state";

interface ChatPanelWorkspaceProps {
  tab: "agenda" | "tasks";
  agendaEmails: Email[];
  pendingTasks: TaskItem[];
  onSelectEmail: (id: string) => void;
  onToggleTask: (id: string) => void;
}

export function ChatPanelWorkspace({
  tab,
  agendaEmails,
  pendingTasks,
  onSelectEmail,
  onToggleTask,
}: ChatPanelWorkspaceProps) {
  if (tab === "agenda") {
    return (
      <div className="h-full overflow-auto rounded-xl border border-[#242427] bg-[#121214] p-3">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#E0E0E0]">
          <CalendarClock className="h-4 w-4 text-[#C49B66]" />
          Agenda prioritaire
        </div>
        <div className="space-y-2">
          {agendaEmails.length === 0 ? (
            <p className="text-xs text-[#71717A]">
              Aucun email agenda détecté.
            </p>
          ) : (
            agendaEmails.map((email) => (
              <button
                key={email.id}
                type="button"
                onClick={() => onSelectEmail(email.id)}
                className="w-full rounded-lg border border-[#242427] bg-[#0A0A0B] px-3 py-2 text-left hover:border-[#C49B66]/50"
              >
                <div className="text-xs font-medium text-[#E0E0E0]">
                  {email.subject}
                </div>
                <div className="mt-0.5 line-clamp-2 text-[11px] text-[#71717A]">
                  {email.preview}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto rounded-xl border border-[#242427] bg-[#121214] p-3">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#E0E0E0]">
        <ListTodo className="h-4 w-4 text-[#C49B66]" />
        Tâches Hermes
      </div>
      <div className="space-y-2">
        {pendingTasks.length === 0 ? (
          <p className="text-xs text-[#71717A]">Aucune tâche en attente.</p>
        ) : (
          pendingTasks.map((task) => (
            <label
              key={task.id}
              className="flex items-start gap-2 rounded-lg border border-[#242427] bg-[#0A0A0B] px-3 py-2 text-xs text-[#D4D4D8]"
            >
              <input
                type="checkbox"
                checked={task.done}
                onChange={() => onToggleTask(task.id)}
                className="mt-0.5"
              />
              <span className="flex-1">{task.text}</span>
            </label>
          ))
        )}
      </div>
    </div>
  );
}
