"use client";
// chat-utils.ts — extracted Sprint 3-3
import type { ChatTraceEvent } from "./chat-types";

export function toShort(value: unknown, max = 140): string {
  const text =
    typeof value === "string"
      ? value
      : value === null || value === undefined
        ? ""
        : JSON.stringify(value);
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}


export function pushTrace(
  set: (fn: (s: { traceEvents: ChatTraceEvent[] }) => Partial<{ traceEvents: ChatTraceEvent[] }>) => void,
  event: Omit<ChatTraceEvent, "id" | "at">
) {
  set((s: { traceEvents: ChatTraceEvent[] }) => ({
    traceEvents: [
      ...s.traceEvents,
      {
        id: `trace-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        at: Date.now(),
        ...event,
      },
    ].slice(-80),
  }));
}

export function parseSseEventBlocks(buffer: string): {
  rest: string;
  blocks: string[];
} {
  const blocks = buffer.split("\n\n");
  const rest = blocks.pop() ?? "";
  return { rest, blocks };
}

export function extractDataFromBlock(block: string): string[] {
  const lines = block.split("\n");
  const data: string[] = [];
  for (const line of lines) {
    if (line.startsWith("data:")) {
      data.push(line.slice(5).trimStart());
    }
  }
  return data;
}

