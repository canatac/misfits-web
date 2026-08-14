#!/usr/bin/env python3
path = "/root/misfits-web/src/components/admin/admin-console-page.tsx"
lines = open(path).readlines()
cr_full = open("/tmp/cr_full2.txt").readlines()

start = next(i for i, l in enumerate(lines) if '{activeTab === "change-requests"' in l)
end = next(i for i in range(start + 1, len(lines)) if '{activeTab === "users"' in lines[i])

print(f"Replacing L{start+1}–{end}: {end-start} lines → {len(cr_full)} lines")
lines = lines[:start] + cr_full + ["\n"] + lines[end:]
open(path, "w").writelines(lines)
print(f"Done: {len(lines)} lines")
