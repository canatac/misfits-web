"""Sprint 12 : ai-client.ts (655 LOC) split.
- Transport HTTP reste dans ai-client.ts (L1..~L390)
- Prompt builders + high-level helpers → ai-prompts.ts (L~390..fin)
- ai-client.ts ré-exporte les high-level pour préserver les imports existants
"""
import re

p = "/root/misfits-web/src/lib/ai-client.ts"
lines = open(p).readlines()
n = len(lines)

# Find the split marker: line containing "Prompt builders" separator
split = None
for i, l in enumerate(lines):
    if "Prompt builders" in l:
        # backup to the /* ------ line
        for j in range(i, max(0, i-3), -1):
            if lines[j].strip().startswith("/*"):
                split = j
                break
        if split is None:
            split = i
        break

assert split, "split marker not found"
print(f"split at L{split+1}")

# Extract from `split` to end
prompt_body = "".join(lines[split:])
transport_body = lines[:split]

# ai-prompts.ts needs the same top-level imports as ai-client.ts (types)
# Simpler approach: prompts file imports from ai-client for transport primitives it needs
# Discover which transport symbols are referenced from prompt_body:
transport_symbols = ["chatCompletion", "streamChatCompletion", "chatCompletionDirect", "streamChatCompletionDirect", "AIError"]
used = [s for s in transport_symbols if re.search(rf'\b{s}\b', prompt_body)]
print("used transport symbols:", used)

# Discover types used in prompt_body
type_symbols = ["AITone", "AILength", "AITranslationLang", "AIComposerRequest", "AIRewriteRequest", "AITranslateRequest", "AISubjectRequest", "AISmartCompleteRequest", "ChatMessage", "GenerateEmailFn", "AIResponse"]
# Just include a broad import from @/types/ai to cover them
prompts_header = (
    '/**\n * ai-prompts.ts — high-level AI helpers extracted from ai-client (Sprint 12).\n */\n'
    'import type {\n'
    '  AITone,\n'
    '  AILength,\n'
    '  AITranslationLang,\n'
    '  AIComposerRequest,\n'
    '  AIRewriteRequest,\n'
    '  AITranslateRequest,\n'
    '  AISubjectRequest,\n'
    '  ChatMessage,\n'
    '} from "@/types/ai";\n'
    'import { resolveFeatureModel } from "@/lib/ai-settings";\n'
    'import { AI_MODEL, ' + ', '.join(used) + ' } from "@/lib/ai-client";\n\n'
)
open("/root/misfits-web/src/lib/ai-prompts.ts", "w").write(prompts_header + prompt_body)

# ai-client.ts keeps transport + adds re-exports
reexports = (
    '\n/* ------------------------------------------------------------------ *\n'
    ' * Sprint 12 : ré-exports depuis ai-prompts pour compat imports\n'
    ' * ------------------------------------------------------------------ */\n'
    'export {\n'
    '  stripHtml,\n'
    '  generateEmail,\n'
    '  rewriteText,\n'
    '  translateText,\n'
    '  generateSubject,\n'
    '  smartComplete,\n'
    '} from "./ai-prompts";\n'
)
open(p, "w").writelines(transport_body + [reexports])
print(f"ai-client.ts: {sum(1 for _ in open(p))} lines")
print(f"ai-prompts.ts: {sum(1 for _ in open('/root/misfits-web/src/lib/ai-prompts.ts'))} lines")
