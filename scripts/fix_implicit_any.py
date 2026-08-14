#!/usr/bin/env python3
"""Fix implicit any in chat-panel.tsx callbacks"""
import re

cp = "/root/misfits-web/src/components/mail/chat-panel.tsx"
c = open(cp).read()

# Add ChatConversation import
if "ChatConversation" not in c:
    c = c.replace(
        'import type { ChatSourceCitation } from "@/types/chat";',
        'import type { ChatSourceCitation, ChatConversation } from "@/types/chat";'
    )

# Fix L95: conversations.find((c) => → type it
c = c.replace(
    "conversations.find((c) => c.id === activeConversationId)",
    "conversations.find((c: ChatConversation) => c.id === activeConversationId)"
)

# Fix L142-144: traceEvents.filter((e) => e.level
# Import ChatTraceEvent
if "ChatTraceEvent" not in c:
    c = c.replace(
        'import type { ChatSourceCitation, ChatConversation } from "@/types/chat";',
        'import type { ChatSourceCitation, ChatConversation } from "@/types/chat";\nimport type { ChatTraceEvent } from "@/stores/chat-types";'
    )

c = c.replace(
    'traceEvents.filter((e) => e.level === "info").length',
    'traceEvents.filter((e: ChatTraceEvent) => e.level === "info").length'
)
c = c.replace(
    'traceEvents.filter((e) => e.level === "warn").length',
    'traceEvents.filter((e: ChatTraceEvent) => e.level === "warn").length'
)
c = c.replace(
    'traceEvents.filter((e) => e.level === "error").length',
    'traceEvents.filter((e: ChatTraceEvent) => e.level === "error").length'
)

# Fix email find
if 'emails.find((e) => e.id === selectedEmailId)' in c:
    if "import type { Email }" not in c and "Email" not in c.split("import")[1:3]:
        c = c.replace(
            'import type { ChatTraceEvent } from "@/stores/chat-types";',
            'import type { ChatTraceEvent } from "@/stores/chat-types";\nimport type { Email } from "@/types/email";'
        )
    c = c.replace(
        "emails.find((e) => e.id === selectedEmailId)",
        "emails.find((e: Email) => e.id === selectedEmailId)"
    )

open(cp, "w").write(c)
print(f"chat-panel.tsx: {len(c.splitlines())} lines")

# Fix chat-store-hermes.test.ts L142
test = "/root/misfits-web/src/stores/__tests__/chat-store-hermes.test.ts"
tc = open(test).read()
# Find the implicit any
tc = re.sub(
    r'\.filter\(\(e\) =>',
    '.filter((e: import("../chat-types").ChatTraceEvent) =>',
    tc, count=1
)
open(test, "w").write(tc)
print(f"chat-store-hermes.test.ts: {len(tc.splitlines())} lines")
