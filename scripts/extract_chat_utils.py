#!/usr/bin/env python3
"""
Sprint 4-2: Extract chat-panel.tsx helpers and constants to chat-panel-utils.ts
"""
path = "/root/misfits-web/src/components/mail/chat-panel.tsx"
lines = open(path).readlines()
content = open(path).read()

# L49-191 (0-indexed 48:191): constants + helpers
helpers_start, helpers_end = 48, 191
block = "".join(lines[helpers_start:helpers_end])

# Write utils file
utils = '''"use client";

// chat-panel-utils.ts — extracted Sprint 4
// Pure constants and helpers for ChatPanel

''' + block

open("/root/misfits-web/src/components/mail/chat-panel/chat-panel-utils.ts", "w").write(utils)
print(f"chat-panel-utils.ts: {len(utils.splitlines())} lines")

# Remove block from panel and add import
new_content = content.replace(block, "")
# Add import after last import
import_line = 'import { QUICK_PROMPTS, QUICK_ACTIONS, ROLE_TEMPLATES, SENSITIVE_KEYWORDS, DEFAULT_PERSONA, DEFAULT_ANALYTICS, containsSensitiveIntent, parseTaskCandidates, redactPii, buildPersonaInstruction } from "./chat-panel/chat-panel-utils";\n'

# Find the last import line
last_import_idx = 0
for i, l in enumerate(new_content.split("\n")):
    if l.startswith("import "):
        last_import_idx = i

new_lines = new_content.split("\n")
new_lines.insert(last_import_idx + 1, import_line)
new_content = "\n".join(new_lines)

open(path, "w").write(new_content)
print(f"chat-panel.tsx: {len(new_content.splitlines())} lines (was {len(lines)})")
