"use client";

import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatPanelInputProps {
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  isStreaming: boolean;
  canInsertLatest: boolean;
  onInsertLatest: () => void;
  canRegenerate: boolean;
  onRegenerate: () => void;
}

export function ChatPanelInput({
  input,
  onInputChange,
  onSend,
  isStreaming,
  canInsertLatest,
  onInsertLatest,
  canRegenerate,
  onRegenerate,
}: ChatPanelInputProps) {
  return (
    <div className="border-t border-[#242427] bg-[#121214] p-3">
      <div className="mb-2 flex items-center gap-2">
        <Button
          onClick={onInsertLatest}
          disabled={!canInsertLatest}
          className="flex-1"
        >
          Action principale: Insérer la dernière réponse dans le brouillon
        </Button>
        <Button
          variant="outline"
          onClick={onRegenerate}
          disabled={!canRegenerate || isStreaming}
        >
          Régénérer
        </Button>
      </div>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSend()}
          placeholder="Demander à Hermes..."
          className="flex-1 rounded-xl border border-[#242427] bg-[#0A0A0B] px-3 py-2 text-sm text-white placeholder-[#71717A] focus:ring-2 focus:ring-[#C49B66] focus:outline-none"
        />
        <Button
          size="icon"
          onClick={onSend}
          disabled={isStreaming || !input.trim()}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
