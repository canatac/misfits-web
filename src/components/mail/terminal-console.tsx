"use client";

import { useMemo } from "react";
import { Bot, TerminalSquare, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChatStore } from "@/stores/chat-store";

interface TerminalConsoleProps {
  isOpen: boolean;
  onClose: () => void;
}

function levelColor(level: "info" | "warn" | "error") {
  if (level === "error") return "text-rose-400";
  if (level === "warn") return "text-amber-300";
  return "text-emerald-300";
}

export function TerminalConsole({ isOpen, onClose }: TerminalConsoleProps) {
  const traceEvents = useChatStore((s) => s.traceEvents);
  const clearTrace = useChatStore((s) => s.clearTrace);

  const rows = useMemo(() => {
    const synthetic = [
      {
        id: "boot-1",
        at: Date.now() - 1000 * 60 * 4,
        kind: "system.boot",
        message: "Misfits Mail workspace initialized.",
        level: "info" as const,
      },
      {
        id: "boot-2",
        at: Date.now() - 1000 * 60 * 2,
        kind: "mail.sync",
        message: "Mailbox state synchronized.",
        level: "info" as const,
      },
    ];
    return [...synthetic, ...traceEvents].slice(-120);
  }, [traceEvents]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-[#242427] bg-[#0A0A0B]/95 backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-[#242427] px-3 py-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#E0E0E0]">
          <TerminalSquare className="h-4 w-4 text-[#C49B66]" />
          <span>Terminal & Activity Console</span>
          <span className="rounded border border-[#242427] bg-[#121214] px-1.5 py-0.5 font-mono text-[10px] text-[#71717A]">
            {rows.length} events
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-[#71717A] hover:bg-[#1D1D20] hover:text-white"
            onClick={clearTrace}
            aria-label="Clear logs"
            title="Clear logs"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-[#71717A] hover:bg-[#1D1D20] hover:text-white"
            onClick={onClose}
            aria-label="Close console"
            title="Close console"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="h-56">
        <div className="space-y-1 p-3 font-mono text-[11px]">
          {rows.map((row) => (
            <div
              key={row.id}
              className="grid grid-cols-[72px_120px_1fr] items-start gap-2 rounded border border-[#1D1D20] bg-[#121214]/60 px-2 py-1.5"
            >
              <span className="text-[#71717A]">
                {new Date(row.at).toLocaleTimeString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </span>
              <span className="text-[#A1A1AA]">{row.kind}</span>
              <span className={levelColor(row.level)}>
                {row.message}
                {row.kind.includes("run") && (
                  <Bot className="ml-1 inline h-3 w-3 align-[-1px] text-[#C49B66]" />
                )}
              </span>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
