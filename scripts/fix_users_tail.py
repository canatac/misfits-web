#!/usr/bin/env python3
path = "/root/misfits-web/src/components/admin/tabs/UsersTab.tsx"
content = open(path).read()

# Replace literal \n sequences with real newlines
content = content.replace('\\n          </div>\\n        </div>\\n    </section>', '\n          </div>\n        </div>\n    </section>')
open(path, 'w').write(content)
tail = content.splitlines()[-6:]
print('\n'.join(tail))
