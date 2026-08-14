#!/usr/bin/env python3
"""
Sprint 6 step 3: extract CR guide chat into src/hooks/useCrGuide.ts
Moves from admin-console-page.tsx:
- types ChangeRequestChatField / ChangeRequestChatMessage / ChangeRequestGuideDraft (L119-132)
- consts CHANGE_REQUEST_GUIDE_ORDER / LABEL (L134-146)
- state crGuideDraft/StepIndex/Messages/Input/Loading/Error (L224-242)
- functions applyGuideToForm, parseGuideResponse, handleGuideChatSubmit
The hook takes setNewRequest as parameter (to apply drafts to the form).
"""
import re

parent = "/root/misfits-web/src/components/admin/admin-console-page.tsx"
lines = open(parent).readlines()
n = len(lines)

def find_line(pattern, start=0):
    for i in range(start, len(lines)):
        if re.search(pattern, lines[i]):
            return i
    return -1

def block_end(start, open_char="{", close_char="}"):
    depth = 0
    for i in range(start, len(lines)):
        depth += lines[i].count(open_char) - lines[i].count(close_char)
        if depth == 0 and i > start:
            return i + 1
    return len(lines)

# ── Locate blocks ─────────────────────────────────────────────
types_start = find_line(r'^type ChangeRequestChatField')
guide_label_start = find_line(r'^const CHANGE_REQUEST_GUIDE_LABEL')
guide_label_end = block_end(guide_label_start)
print(f"types+consts: L{types_start+1}-{guide_label_end}")

state_start = find_line(r'const \[crGuideDraft')
state_end = find_line(r'const \[crGuideError') + 1
print(f"state: L{state_start+1}-{state_end}")

apply_start = find_line(r'^\s*function applyGuideToForm')
apply_end = block_end(apply_start)
parse_start = find_line(r'^\s*function parseGuideResponse')
parse_end = block_end(parse_start)
submit_start = find_line(r'^\s*async function handleGuideChatSubmit')
submit_end = block_end(submit_start)
print(f"applyGuideToForm: L{apply_start+1}-{apply_end}")
print(f"parseGuideResponse: L{parse_start+1}-{parse_end}")
print(f"handleGuideChatSubmit: L{submit_start+1}-{submit_end}")

# ── Build the hook file ───────────────────────────────────────
types_block = "".join(lines[types_start:guide_label_end])
state_block = "".join(lines[state_start:state_end])
apply_block = "".join(lines[apply_start:apply_end])
parse_block = "".join(lines[parse_start:parse_end])
submit_block = "".join(lines[submit_start:submit_end])

hook = '''"use client";
// useCrGuide.ts — extracted Sprint 6 from admin-console-page.tsx
// Guided change-request formulation chat (Hermes-backed).

import { useState, type FormEvent, type Dispatch, type SetStateAction } from "react";
import type { CreateChangeRequestInput } from "@/types/change-request";

''' + types_block.replace("type ChangeRequestChatField", "export type ChangeRequestChatField") \
     .replace("type ChangeRequestChatMessage", "export type ChangeRequestChatMessage") \
     .replace("type ChangeRequestGuideDraft", "export type ChangeRequestGuideDraft") + '''

export function useCrGuide(
  newRequest: CreateChangeRequestInput,
  setNewRequest: Dispatch<SetStateAction<CreateChangeRequestInput>>
) {
''' + state_block + '''
''' + apply_block + '''
''' + parse_block + '''
''' + submit_block + '''
  return {
    crGuideDraft,
    crGuideStepIndex,
    crGuideMessages,
    crGuideInput,
    setCrGuideInput,
    crGuideLoading,
    crGuideError,
    applyGuideToForm,
    handleGuideChatSubmit,
  };
}
'''
open("/root/misfits-web/src/hooks/useCrGuide.ts", "w").write(hook)
print(f"useCrGuide.ts: {len(hook.splitlines())} lines")

# ── Remove from parent & inject hook call ─────────────────────
hook_call = '''  const {
    crGuideDraft,
    crGuideStepIndex,
    crGuideMessages,
    crGuideInput,
    setCrGuideInput,
    crGuideLoading,
    crGuideError,
    applyGuideToForm,
    handleGuideChatSubmit,
  } = useCrGuide(newRequest, setNewRequest);
'''

# Remove ranges (they may not be contiguous): types_start..guide_label_end,
# state_start..state_end, apply/parse/submit
ranges = sorted([
    (types_start, guide_label_end),
    (state_start, state_end),
    (apply_start, apply_end),
    (parse_start, parse_end),
    (submit_start, submit_end),
], reverse=True)

new_lines = lines[:]
for s, e in ranges:
    if s == state_start:
        new_lines[s:e] = [hook_call]
    else:
        new_lines[s:e] = []

# Add import
imp_pos = 0
for i, l in enumerate(new_lines):
    if l.startswith("import "):
        imp_pos = i + 1
new_lines.insert(imp_pos, 'import { useCrGuide, type ChangeRequestChatMessage, type ChangeRequestGuideDraft, type ChangeRequestChatField } from "@/hooks/useCrGuide";\n')

open(parent, "w").writelines(new_lines)
total = len(new_lines)
print(f"parent: {total} lines (was {n})")
