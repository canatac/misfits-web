"use client";
// chat-types.ts — extracted Sprint 3-3
import type { ChatConversation } from "@/types/chat";

export type TraceLevel = "info" | "warn" | "error";

export interface ChatTraceEvent {
  id: string;
  at: number;
  kind: string;
  message: string;
  level: TraceLevel;
}
