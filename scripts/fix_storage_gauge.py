#!/usr/bin/env python3
"""Fix duplicate formatTime in StorageGauge.tsx"""
path = "/root/misfits-web/src/components/dashboard/StorageGauge.tsx"
content = open(path).read()

# Remove the second formatTime definition (the original one before StorageGauge)
import re
# Remove the second occurrence of formatTime
second = content.find("export function formatTime", content.find("export function formatTime") + 1)
if second != -1:
    # Find end of that function
    func_end = content.find("\n}\n", second) + 3
    content = content[:second] + content[func_end:]

open(path, "w").write(content)
print(f"Fixed. Lines: {len(content.splitlines())}")
print(content[:300])
