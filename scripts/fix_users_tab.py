#!/usr/bin/env python3
path = "/root/misfits-web/src/components/admin/tabs/UsersTab.tsx"
lines = open(path).readlines()
# Remove broken closing (last 4 lines)
lines = lines[:-4]
lines.append('          </div>\n')
lines.append('        </div>\n')
lines.append('    </section>\n')
lines.append('  );\n')
lines.append('}\n')
open(path, "w").writelines(lines)
print("Fixed. Last 5 lines:")
print("".join(lines[-5:]))
