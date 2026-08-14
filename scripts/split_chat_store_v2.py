#!/usr/bin/env python3
"""
Split chat-store.ts in-place:
1. Extract types → chat-types.ts
2. Extract persistence → chat-persistence.ts  
3. Extract pure utils → chat-utils.ts
4. Rewrite chat-store.ts to import from those + keep Hermes helpers + store
"""
import re

src = "/root/misfits-web/src/stores/chat-store.ts"
lines = open(src).readlines()
n = len(lines)
print(f"Total: {n} lines")

# Find section boundaries
def find_line(pattern, lines, start=0):
    for i in range(start, len(lines)):
        if re.search(pattern, lines[i]):
            return i
    return -1

# Boundaries (0-indexed)
type_start = find_line(r'^type TraceLevel', lines)
interface_start = find_line(r'^export interface ChatTraceEvent', lines)
interface_end = find_line(r'^interface ChatStore', lines)
interface_chat_store_end = find_line(r'^}\s*$', lines, interface_end) + 1  # closing }

load_start = find_line(r'^function loadConversations', lines)
save_start = find_line(r'^function saveConversations', lines)
save_end = find_line(r'^}\s*$', lines, save_start) + 1

to_short_start = find_line(r'^function toShort', lines)
push_trace_start = find_line(r'^function pushTrace', lines)
push_trace_end = find_line(r'^}\s*$', lines, push_trace_start) + 1

parse_sse_start = find_line(r'^function parseSseEventBlocks', lines)
parse_sse_end = find_line(r'^}\s*$', lines, parse_sse_start) + 1

extract_start = find_line(r'^function extractDataFromBlock', lines)
extract_end = find_line(r'^}\s*$', lines, extract_start) + 1

# ChatSetState type alias
chatsetstate_start = find_line(r'^type ChatSetState', lines)
chatsetstate_end = find_line(r'^\) => void;', lines, chatsetstate_start) + 1

print(f"type TraceLevel: L{type_start+1}")
print(f"ChatTraceEvent: L{interface_start+1}")
print(f"ChatStore end: L{interface_chat_store_end}")
print(f"loadConversations: L{load_start+1} - {save_end}")
print(f"toShort: L{to_short_start+1}")
print(f"pushTrace: L{push_trace_start+1} - {push_trace_end}")
print(f"parseSseEventBlocks: L{parse_sse_start+1} - {parse_sse_end}")
print(f"extractDataFromBlock: L{extract_start+1} - {extract_end}")
print(f"ChatSetState: L{chatsetstate_start+1} - {chatsetstate_end}")

# ── 1. chat-types.ts ──────────────────────────────────────────
types = ''.join([
    '"use client";\n',
    '// chat-types.ts — extracted Sprint 3-3\n\n',
    ''.join(lines[type_start:interface_start]),
    '\n',
    ''.join(lines[interface_start:interface_end]),
    '\n',
    ''.join(lines[interface_end:interface_chat_store_end]),
    '\n',
    ''.join(lines[chatsetstate_start:chatsetstate_end]),
    '\n',
])
open("/root/misfits-web/src/stores/chat-types.ts", "w").write(types)
print(f"\nchat-types.ts: {len(types.splitlines())} lines")

# ── 2. chat-persistence.ts ────────────────────────────────────
# STORAGE_KEY and MAX_CONVERSATIONS are consts at L4-5
const_start = find_line(r'^const STORAGE_KEY', lines)
const_end = find_line(r'^let activeAbortController', lines)  # stop before the singleton

persistence = ''.join([
    '"use client";\n',
    '// chat-persistence.ts — extracted Sprint 3-3\n',
    'import type { ChatConversation } from "@/types/chat";\n\n',
    ''.join(lines[const_start:const_end]),
    '\n',
    ''.join(lines[load_start:save_end]),
    '\n',
])
open("/root/misfits-web/src/stores/chat-persistence.ts", "w").write(persistence)
print(f"chat-persistence.ts: {len(persistence.splitlines())} lines")

# ── 3. chat-utils.ts ──────────────────────────────────────────
utils = ''.join([
    '"use client";\n',
    '// chat-utils.ts — extracted Sprint 3-3\n',
    'import type { ChatTraceEvent, ChatSetState } from "./chat-types";\n\n',
    ''.join(lines[to_short_start:chatsetstate_start]),  # toShort up to (not including) ChatSetState
    '\n',
    ''.join(lines[push_trace_start:push_trace_end]),
    '\n',
    ''.join(lines[parse_sse_start:parse_sse_end]),
    '\n',
    ''.join(lines[extract_start:extract_end]),
    '\n',
])
# Fix: ChatSetState is used in pushTrace but is now in chat-types — already imported
open("/root/misfits-web/src/stores/chat-utils.ts", "w").write(utils)
print(f"chat-utils.ts: {len(utils.splitlines())} lines")

# ── 4. Rewrite chat-store.ts ──────────────────────────────────
# Keep: "use client", imports, activeAbortController singleton,
#        Hermes helpers (summarizeHermesEvent, etc.), store create()
# Remove: type/interface blocks, consts, persistence fns, utils fns

# Sections to REMOVE (0-indexed, exclusive end):
remove_ranges = sorted([
    (type_start, interface_chat_store_end),    # types
    (const_start, const_end),                  # consts
    (load_start, save_end),                    # persistence
    (to_short_start, chatsetstate_start),      # toShort (keep ChatSetState for now? No, it's in utils)
    (chatsetstate_start, chatsetstate_end),    # ChatSetState type alias
    (push_trace_start, push_trace_end),        # pushTrace
    (parse_sse_start, parse_sse_end),          # parseSseEventBlocks
    (extract_start, extract_end),              # extractDataFromBlock
])

# Merge overlapping ranges
merged = []
for start, end in remove_ranges:
    if merged and start <= merged[-1][1]:
        merged[-1] = (merged[-1][0], max(merged[-1][1], end))
    else:
        merged.append([start, end])

print(f"\nRemoving ranges: {[(s+1, e) for s, e in merged]}")

# Build new content
new_lines = []
i = 0
while i < len(lines):
    removed = False
    for start, end in merged:
        if start <= i < end:
            i = end
            removed = True
            break
    if not removed:
        new_lines.append(lines[i])
        i += 1

# Add imports at top (after "use client" line)
import_injection = '''import type { ChatTraceEvent, TraceLevel, ChatStore, ChatSetState } from "./chat-types";
import { STORAGE_KEY, MAX_CONVERSATIONS, loadConversations, saveConversations } from "./chat-persistence";
import { toShort, pushTrace, parseSseEventBlocks, extractDataFromBlock } from "./chat-utils";
'''
# Find position after existing imports
insert_pos = 0
for i, l in enumerate(new_lines):
    if l.startswith("import ") or l.startswith('"use client"'):
        insert_pos = i + 1
# Insert after last import
new_lines.insert(insert_pos, import_injection)

new_content = "".join(new_lines)
open(src, "w").write(new_content)
print(f"chat-store.ts: {len(new_content.splitlines())} lines (was {n})")
