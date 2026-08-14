#!/usr/bin/env python3
"""Fix last 4 CI errors"""

# 1. chat-utils.ts: remove ChatSetState import, fix pushTrace param
cu = "/root/misfits-web/src/stores/chat-utils.ts"
c = open(cu).read()
c = c.replace(
    'import type { ChatTraceEvent, ChatSetState } from "./chat-types";',
    'import type { ChatTraceEvent } from "./chat-types";'
)
# Fix: pushTrace uses (s) inside set((s) => {...}) — s should be typed
c = c.replace(
    "set((s) => ({",
    "set((s: { traceEvents: ChatTraceEvent[] }) => ({"
)
open(cu, "w").write(c)
print(f"chat-utils.ts: {len(c.splitlines())} lines")

# 2. contact-utils.ts: add AVATAR_COLORS import
cou = "/root/misfits-web/src/stores/contact-utils.ts"
c = open(cou).read()
if "AVATAR_COLORS" not in c:
    c = c.replace(
        'import type { Contact, ContactFrequency, ContactGroup } from "@/types/contact";',
        'import type { Contact, ContactFrequency, ContactGroup } from "@/types/contact";\nimport { AVATAR_COLORS } from "@/lib/mock-contacts";'
    )
open(cou, "w").write(c)
print(f"contact-utils.ts: {len(c.splitlines())} lines")
