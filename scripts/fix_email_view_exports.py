#!/usr/bin/env python3
"""Add exports to email-view-utils.ts"""
import re
path = "/root/misfits-web/src/components/mail/email-view-utils.ts"
content = open(path).read()

names = ["ATTACHMENT_ICONS", "QUOTE_PATTERNS"]
funcs = ["formatFullDate", "formatFileSize", "getInitials", "toPlainText"]

for n in names:
    content = content.replace(f"const {n}", f"export const {n}")
for f in funcs:
    content = content.replace(f"function {f}", f"export function {f}")

open(path, "w").write(content)
print(f"Done: {len(content.splitlines())} lines")
