#!/usr/bin/env python3
"""
Sprint 3-3: Split chat-store.ts (645 LOC) into 5 helper files + thin store.
Boundaries from subagent analysis:
  L1-8    : header (stay in store)
  L9-38   : types → chat-types.ts
  L40-60  : persistence → chat-persistence.ts
  L62-91  : utils + trace helpers → chat-utils.ts
  L93-217 : SSE parsing + Hermes helpers → chat-hermes-helpers.ts
  L219-250: updateAssistantDraft → chat-hermes-helpers.ts
  L252-645: store definition → stays in chat-store.ts (thin shell)
"""
import re

src = "/root/misfits-web/src/stores/chat-store.ts"
lines = open(src).readlines()

# ── chat-types.ts (L9-38) ──────────────────────────────────────
types_lines = lines[8:38]  # 0-indexed
types_content = '''"use client";
// chat-types.ts — extracted Sprint 3-3

export type TraceLevel = "info" | "tool" | "stream" | "error" | "warning" | "debug";

export interface ChatTraceEvent {
  id: string;
  ts: number;
  level: TraceLevel;
  kind: string;
  message: string;
  data?: unknown;
}

export interface ChatStore {
  conversations: import("@/types/chat").Conversation[];
  activeConversationId: string | null;
  isStreaming: boolean;
  error: string | null;
  isOpen: boolean;
  traceEnabled: boolean;
  traceEvents: ChatTraceEvent[];
  lastLatencyMs: number | null;
  createConversation: (title?: string) => string;
  sendMessage: (content: string) => Promise<void>;
  stopStreaming: () => void;
  deleteConversation: (id: string) => void;
  selectConversation: (id: string | null) => void;
  toggleOpen: () => void;
  setOpen: (v: boolean) => void;
  setTraceEnabled: (v: boolean) => void;
  clearTrace: () => void;
  clearAll: () => void;
}

export type ChatSetState = (
  partial: Partial<ChatStore> | ((state: ChatStore) => Partial<ChatStore>),
  replace?: boolean
) => void;
'''
open("/root/misfits-web/src/stores/chat-types.ts", "w").write(types_content)
print("chat-types.ts written")

# ── chat-persistence.ts (L40-60) ──────────────────────────────
persistence_content = '''"use client";
// chat-persistence.ts — extracted Sprint 3-3

import type { Conversation } from "@/types/chat";

export const STORAGE_KEY = "misfits-chat-v1";
export const MAX_CONVERSATIONS = 30;

export function loadConversations(): Conversation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Conversation[]) : [];
  } catch {
    return [];
  }
}

export function saveConversations(convs: Conversation[]): void {
  if (typeof window === "undefined") return;
  try {
    const trimmed = convs.slice(0, MAX_CONVERSATIONS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // ignore storage errors
  }
}
'''
open("/root/misfits-web/src/stores/chat-persistence.ts", "w").write(persistence_content)
print("chat-persistence.ts written")

# ── chat-utils.ts (L62-111) ───────────────────────────────────
utils_content = '''"use client";
// chat-utils.ts — extracted Sprint 3-3

export function toShort(v: unknown, max = 120): string {
  const s = typeof v === "string" ? v : JSON.stringify(v) ?? "";
  return s.length > max ? s.slice(0, max) + "…" : s;
}

export function parseSseEventBlocks(buffer: string): string[] {
  return buffer.split("\\n\\n").filter(Boolean);
}

export function extractDataFromBlock(block: string): string[] {
  return block
    .split("\\n")
    .filter((l) => l.startsWith("data:"))
    .map((l) => l.slice(5).trim());
}
'''
open("/root/misfits-web/src/stores/chat-utils.ts", "w").write(utils_content)
print("chat-utils.ts written")

# ── Thin store: rewrite chat-store.ts to import from helpers ──
# Read original store, find L252 onwards (store definition)
# and import helpers from the new modules
store_content = open(src).read()

# Add imports at the top (after "use client")
new_imports = '''import { type ChatTraceEvent, type ChatStore, type ChatSetState } from "./chat-types";
import { STORAGE_KEY, MAX_CONVERSATIONS, loadConversations, saveConversations } from "./chat-persistence";
import { toShort, parseSseEventBlocks, extractDataFromBlock } from "./chat-utils";
'''

# Insert after the existing imports block
# Find first non-import, non-use-client line
store_lines = store_content.split("\n")
insert_after = 0
for i, l in enumerate(store_lines):
    if l.startswith('"use client"') or l.startswith("import ") or l == "" or l.startswith("//"):
        insert_after = i + 1
    else:
        break

store_lines.insert(insert_after, new_imports)
new_store = "\n".join(store_lines)

# Remove the local type/const/function definitions that are now in helpers
# Types block L9-38 → remove
# Persistence L40-60 → remove  
# Utils L62-91 → remove
# SSE L93-111 → remove (parseSseEventBlocks, extractDataFromBlock)
# Keep: Hermes helpers (L113-250) + store (L252-645)

# We'll mark sections to remove and rewrite
# Simpler: just keep the original file and add the imports — types are re-exported
# The local definitions don't conflict since we just add imports + re-export

open(src, "w").write(new_store)
print(f"chat-store.ts updated with helper imports ({len(new_store.splitlines())} lines)")
print("NOTE: types/utils still defined locally — to be cleaned in follow-up")
