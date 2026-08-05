"use client";

import { Sparkles, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ChatPanelHeaderProps {
  uiMode: "assistant" | "expert";
  onModeChange: (mode: "assistant" | "expert") => void;
  onClose: () => void;
  isStreaming: boolean;
  lastLatencyMs: number | null;
  traceEnabled: boolean;
  onToggleTrace: () => void;
}

export function ChatPanelHeader({
  uiMode,
  onModeChange,
  onClose,
  isStreaming,
  lastLatencyMs,
  traceEnabled,
  onToggleTrace,
}: ChatPanelHeaderProps) {
  return (
    <div className="border-b border-[var(--color-border)] p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[var(--color-brand-500)]" />
          <span className="text-sm font-semibold">Assistant Mail</span>
          {isStreaming && <Badge variant="secondary">En cours</Badge>}
          {lastLatencyMs !== null && <Badge variant="outline">{Math.round(lastLatencyMs)}ms</Badge>}
        </div>

        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant={uiMode === "assistant" ? "default" : "outline"}
            onClick={() => onModeChange("assistant")}
          >
            Assistant
          </Button>
          <Button
            size="sm"
            variant={uiMode === "expert" ? "default" : "outline"}
            onClick={() => onModeChange("expert")}
          >
            Expert
          </Button>
          <Button size="sm" variant={traceEnabled ? "secondary" : "outline"} onClick={onToggleTrace}>
            Trace
          </Button>
          <Button size="icon" variant="ghost" onClick={onClose} aria-label="Fermer assistant">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
