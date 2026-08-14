#!/usr/bin/env python3
"""
Split contact-store.ts (631 LOC) into:
- contact-utils.ts: genId, pickAvatarColor, contactInitials, normalizeEmail,
                    deriveFrequency, FREQUENCY_LABELS, nowISO
- contact-serialisers.ts: toVCard, toCSVRow, exportCSV, parseVCard, parseCSV, parseCSVRows
- contact-store.ts: imports from helpers + ContactState interface + store (slimmed)
"""
import re

src = "/root/misfits-web/src/stores/contact-store.ts"
lines = open(src).readlines()
n = len(lines)

def find_line(pattern, lines, start=0):
    for i in range(start, len(lines)):
        if re.search(pattern, lines[i]):
            return i
    return -1

def find_fn_end(start, lines):
    """Find closing } of function/const block at start line"""
    depth = 0
    for i in range(start, len(lines)):
        depth += lines[i].count("{") - lines[i].count("}")
        if depth == 0 and i > start and "}" in lines[i]:
            return i + 1
    return len(lines)

# Section boundaries
genId_s = find_line(r'^function genId', lines)
pick_s = find_line(r'^export function pickAvatarColor', lines)
init_s = find_line(r'^export function contactInitials', lines)
norm_s = find_line(r'^function normalizeEmail', lines)
derive_s = find_line(r'^export function deriveFrequency', lines)
freq_s = find_line(r'^export const FREQUENCY_LABELS', lines)
freq_e = find_fn_end(freq_s, lines)

now_s = find_line(r'^const nowISO', lines)
now_e = now_s + 1

# Get end of each function
genId_e = find_fn_end(genId_s, lines)
pick_e = find_fn_end(pick_s, lines)
init_e = find_fn_end(init_s, lines)
norm_e = find_fn_end(norm_s, lines)
derive_e = find_fn_end(derive_s, lines)

# Serialisers
toVCard_s = find_line(r'^function toVCard', lines)
toVCard_e = find_fn_end(toVCard_s, lines)
toCSV_s = find_line(r'^function toCSVRow', lines)
toCSV_e = find_fn_end(toCSV_s, lines)
exportCSV_s = find_line(r'^function exportCSV', lines)
exportCSV_e = find_fn_end(exportCSV_s, lines)
parseVCard_s = find_line(r'^export function parseVCard', lines)
parseVCard_e = find_fn_end(parseVCard_s, lines)
parseCSV_s = find_line(r'^export function parseCSV', lines)
parseCSV_e = find_fn_end(parseCSV_s, lines)
parseCSVRows_s = find_line(r'^function parseCSVRows', lines)
parseCSVRows_e = find_fn_end(parseCSVRows_s, lines)

# Seed functions
seedC_s = find_line(r'^function seedContacts', lines)
seedC_e = find_fn_end(seedC_s, lines)
seedG_s = find_line(r'^function seedGroups', lines)
seedG_e = find_fn_end(seedG_s, lines)

print(f"genId: {genId_s+1}-{genId_e}, pick: {pick_s+1}-{pick_e}")
print(f"init: {init_s+1}-{init_e}, norm: {norm_s+1}-{norm_e}")
print(f"derive: {derive_s+1}-{derive_e}, freq: {freq_s+1}-{freq_e}")
print(f"toVCard: {toVCard_s+1}-{toVCard_e}, exportCSV: {exportCSV_s+1}-{exportCSV_e}")
print(f"parseVCard: {parseVCard_s+1}-{parseVCard_e}, parseCSV: {parseCSV_s+1}-{parseCSV_e}")
print(f"parseCSVRows: {parseCSVRows_s+1}-{parseCSVRows_e}")
print(f"seeds: {seedC_s+1}-{seedC_e}, {seedG_s+1}-{seedG_e}")

# ── contact-utils.ts ──────────────────────────────────────────
import_types = ''.join(lines[0:3]).strip()  # "use client" + imports
# Extract just the relevant imports
utils_content = '''"use client";
// contact-utils.ts — extracted Sprint 3-3
import type { Contact, ContactFrequency, ContactGroup } from "@/types/contact";

'''
# Add all utility functions
for s, e in [(genId_s, genId_e), (pick_s, pick_e), (init_s, init_e),
             (norm_s, norm_e), (derive_s, derive_e), (freq_s, freq_e),
             (now_s, now_e)]:
    utils_content += "".join(lines[s:e]) + "\n"
# Make non-exported functions exported
utils_content = utils_content.replace("function genId(", "export function genId(")
utils_content = utils_content.replace("function normalizeEmail(", "export function normalizeEmail(")
utils_content = utils_content.replace("const nowISO", "export const nowISO")
open("/root/misfits-web/src/stores/contact-utils.ts", "w").write(utils_content)
print(f"\ncontact-utils.ts: {len(utils_content.splitlines())} lines")

# ── contact-serialisers.ts ────────────────────────────────────
ser_content = '''"use client";
// contact-serialisers.ts — extracted Sprint 3-3
import type { Contact, ContactImport } from "@/types/contact";

'''
for s, e in [(toVCard_s, toVCard_e), (toCSV_s, toCSV_e), (exportCSV_s, exportCSV_e),
             (parseVCard_s, parseVCard_e), (parseCSV_s, parseCSV_e), (parseCSVRows_s, parseCSVRows_e)]:
    block = "".join(lines[s:e])
    # Export private fns
    block = block.replace("function toVCard(", "export function toVCard(")
    block = block.replace("function toCSVRow(", "export function toCSVRow(")
    block = block.replace("function exportCSV(", "export function exportCSV(")
    block = block.replace("function parseCSVRows(", "export function parseCSVRows(")
    ser_content += block + "\n"
open("/root/misfits-web/src/stores/contact-serialisers.ts", "w").write(ser_content)
print(f"contact-serialisers.ts: {len(ser_content.splitlines())} lines")

# ── Rewrite contact-store.ts ──────────────────────────────────
# Remove all extracted sections, add imports
remove_ranges = sorted([
    (genId_s, freq_e),            # all utils up to FREQUENCY_LABELS end
    (toVCard_s, parseCSVRows_e),   # all serialisers
    (seedC_s, seedG_e),            # seed fns (keep inline — small)
    (now_s, now_e),                # nowISO
])

# DON'T remove seed functions — they're complex and small
# Restore seeds
remove_ranges = sorted([
    (genId_s, freq_e),
    (toVCard_s, parseCSVRows_e),
    (now_s, now_e),
])

# Merge overlapping
merged = []
for start, end in remove_ranges:
    if merged and start <= merged[-1][1] + 2:
        merged[-1] = [merged[-1][0], max(merged[-1][1], end)]
    else:
        merged.append([start, end])

print(f"Remove ranges: {[(s+1, e) for s, e in merged]}")

new_lines = []
i = 0
while i < len(lines):
    skip = False
    for s, e in merged:
        if s <= i < e:
            i = e
            skip = True
            break
    if not skip:
        new_lines.append(lines[i])
        i += 1

# Add imports after existing import block
injection = '''import { genId, pickAvatarColor, contactInitials, normalizeEmail, deriveFrequency, FREQUENCY_LABELS, nowISO } from "./contact-utils";
import { toVCard, exportCSV, parseVCard, parseCSV } from "./contact-serialisers";
'''
insert_pos = 0
for i, l in enumerate(new_lines):
    if l.startswith("import ") or l.startswith('"use client"'):
        insert_pos = i + 1
new_lines.insert(insert_pos, injection)

new_store = "".join(new_lines)
open(src, "w").write(new_store)
print(f"contact-store.ts: {len(new_store.splitlines())} lines (was {n})")
