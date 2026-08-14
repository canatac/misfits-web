#!/usr/bin/env python3
"""Move Analytics and PersonaPreset types to chat-panel-utils.ts, re-export from chat-panel.tsx"""
import re

panel = "/root/misfits-web/src/components/mail/chat-panel.tsx"
utils = "/root/misfits-web/src/components/mail/chat-panel/chat-panel-utils.ts"

panel_content = open(panel).read()
utils_content = open(utils).read()

# Extract the two types from panel
analytics_match = re.search(r'type Analytics = \{[^}]+\};', panel_content, re.DOTALL)
persona_match = re.search(r'type PersonaPreset = \{[^}]+\};', panel_content, re.DOTALL)

analytics_type = analytics_match.group(0) if analytics_match else ""
persona_type = persona_match.group(0) if persona_match else ""

print("Analytics:", analytics_type[:50])
print("PersonaPreset:", persona_type[:50])

# Add exported types to top of utils (after the header comment)
types_block = f"""
export {analytics_type}

export {persona_type}

"""
utils_content = utils_content.replace(
    '"use client";\n\n// chat-panel-utils.ts',
    '"use client";\n\n// chat-panel-utils.ts'
)
# Insert after header
insert_at = utils_content.find("\nexport const QUICK_PROMPTS")
utils_content = utils_content[:insert_at] + types_block + utils_content[insert_at:]
open(utils, "w").write(utils_content)

# In panel: replace type definitions with imports
panel_content = panel_content.replace(analytics_type, "")
panel_content = panel_content.replace(persona_type, "")

# Add import at top of panel (after last existing import from chat-panel/)
import_line = 'import type { Analytics, PersonaPreset } from "./chat-panel/chat-panel-utils";\n'
# Find the utils import line
if "chat-panel-utils" not in panel_content:
    # Insert after the existing chat-panel/ imports
    insert_after = panel_content.rfind('import { QUICK_PROMPTS')
    end_of_line = panel_content.find('\n', insert_after) + 1
    panel_content = panel_content[:end_of_line] + import_line + panel_content[end_of_line:]

open(panel, "w").write(panel_content)
print(f"Done. panel: {len(panel_content.splitlines())} lines, utils: {len(utils_content.splitlines())} lines")
