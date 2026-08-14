#!/usr/bin/env python3
path = "/root/misfits-web/src/components/admin/tabs/UsersTab.tsx"
lines = open(path).readlines()
# Remove last 5 lines (broken closing) and replace properly
while lines and lines[-1].strip() in ['', '}', ');', '</section>', '</div>', '  );', '  }']:
    lines.pop()
# Now we should be at: </div> (closing the space-y-3 div)
lines.append('        </div>\n')  # close space-y-3
lines.append('    </section>\n')
lines.append('  );\n')
lines.append('}\n')
open(path, 'w').writelines(lines)
print("Done. Last 5 lines:")
print("".join(lines[-5:]))
