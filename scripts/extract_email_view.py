#!/usr/bin/env python3
"""Extract email-view helpers and constants to email-view-utils.ts"""
path = "/root/misfits-web/src/components/mail/email-view.tsx"
lines = open(path).readlines()
content = open(path).read()

# Helpers: L61-118 (ATTACHMENT_ICONS + helpers + QUOTE_PATTERNS)
# Also AttachmentCard at L846-end
helpers_start, helpers_end = 60, 118  # 0-indexed

block = "".join(lines[helpers_start:helpers_end])

# AttachmentCard component at end (L846-end = 0-indexed 845+)
ac_start = None
for i, l in enumerate(lines):
    if "function AttachmentCard(" in l:
        ac_start = i
        break

ac_block = "".join(lines[ac_start:]) if ac_start else ""

# Write utils file (helpers only)
utils_imports = ""
for l in lines[:60]:
    if "import" in l and ("FileIcon\|Paperclip\|File\|AttachmentType\|EmailAttachment" in str(l)):
        utils_imports += l

utils = '''"use client";
// email-view-utils.ts — extracted Sprint 4

import type { AttachmentType, EmailAttachment } from "@/types/mail";
import { FileIcon, FileText, FileSpreadsheet, FileCode, Paperclip } from "lucide-react";

''' + block

open("/root/misfits-web/src/components/mail/email-view-utils.ts", "w").write(utils)
print(f"email-view-utils.ts: {len(utils.splitlines())} lines")

# Remove helpers from email-view.tsx
new_content = content.replace(block, "")

# Add import
import_line = 'import { ATTACHMENT_ICONS, QUOTE_PATTERNS, formatFullDate, formatFileSize, getInitials, toPlainText } from "./email-view-utils";\n'
new_lines = new_content.split("\n")
last_import_idx = max(i for i, l in enumerate(new_lines) if l.startswith("import "))
new_lines.insert(last_import_idx + 1, import_line)
new_content = "\n".join(new_lines)

open(path, "w").write(new_content)
print(f"email-view.tsx: {len(new_content.splitlines())} lines (was {len(lines)})")
