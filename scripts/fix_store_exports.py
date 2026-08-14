#!/usr/bin/env python3
"""Fix missing exports in extracted helper files and re-export from store"""

fixes = {
    "/root/misfits-web/src/stores/chat-types.ts": [
        ("type TraceLevel", "export type TraceLevel"),
        ("interface ChatStore", "export interface ChatStore"),
        ("type ChatSetState", "export type ChatSetState"),
    ],
    "/root/misfits-web/src/stores/chat-persistence.ts": [
        ("const STORAGE_KEY", "export const STORAGE_KEY"),
        ("const MAX_CONVERSATIONS", "export const MAX_CONVERSATIONS"),
        ("function loadConversations", "export function loadConversations"),
        ("function saveConversations", "export function saveConversations"),
    ],
    "/root/misfits-web/src/stores/chat-utils.ts": [
        ("function toShort", "export function toShort"),
        ("function pushTrace", "export function pushTrace"),
        ("function parseSseEventBlocks", "export function parseSseEventBlocks"),
        ("function extractDataFromBlock", "export function extractDataFromBlock"),
    ],
    "/root/misfits-web/src/stores/contact-store.ts": [
        # Re-export helpers imported from submodules
    ],
}

for path, replacements in fixes.items():
    c = open(path).read()
    for old, new in replacements:
        c = c.replace(old, new)
    open(path, "w").write(c)
    print(f"{path.split('/')[-1]}: {len(c.splitlines())} lines")

# Also add re-exports to contact-store.ts so existing importers keep working
contact_store = "/root/misfits-web/src/stores/contact-store.ts"
c = open(contact_store).read()
# Add re-exports at the end
if "export { contactInitials" not in c:
    c += '''
// Re-exports for backward-compat (imported elsewhere from "@/stores/contact-store")
export { contactInitials, pickAvatarColor, deriveFrequency, FREQUENCY_LABELS } from "./contact-utils";
export { parseVCard, parseCSV } from "./contact-serialisers";
'''
open(contact_store, "w").write(c)
print(f"contact-store.ts: re-exports added ({len(c.splitlines())} lines)")

# Fix chat-panel.tsx implicit any callbacks
# L95: parameter 'c', L142-144: parameter 'e'
import re
cp = "/root/misfits-web/src/components/mail/chat-panel.tsx"
cc = open(cp).read()
lines = cc.split("\n")
for i, l in enumerate(lines[90:150], 91):
    print(f"L{i}: {l}")
