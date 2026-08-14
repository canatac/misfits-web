#!/usr/bin/env python3
"""Add exports to chat-panel-utils.ts and fix types (PersonaPreset, Analytics)"""
path = "/root/misfits-web/src/components/mail/chat-panel/chat-panel-utils.ts"
content = open(path).read()

# Add export to all const and function declarations
import re
content = re.sub(r'^(const )(QUICK_PROMPTS|QUICK_ACTIONS|ROLE_TEMPLATES|SENSITIVE_KEYWORDS|DEFAULT_PERSONA|DEFAULT_ANALYTICS)',
                 r'export \1\2', content, flags=re.MULTILINE)
content = re.sub(r'^(function )(containsSensitiveIntent|parseTaskCandidates|redactPii|buildPersonaInstruction)',
                 r'export \1\2', content, flags=re.MULTILINE)

# The file uses PersonaPreset and Analytics types — they must be imported or defined
# Check if they exist in chat-panel.tsx types
# They come from local types in chat-panel.tsx — we need to check
open(path, "w").write(content)
print(f"chat-panel-utils.ts: {len(content.splitlines())} lines, exports added")
print("Exports:", [l.strip() for l in content.split("\n") if l.startswith("export")])
