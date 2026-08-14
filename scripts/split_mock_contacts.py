import re, json
p = "/root/misfits-web/src/lib/mock-contacts.ts"
lines = open(p).readlines()
seeds_ts = "".join(lines[92:605])
seeds_ts = re.sub(r'\bcolor\((\d+)\)', r'"__COLOR_\1__"', seeds_ts)
seeds_ts = re.sub(r'\bdaysAgo\((\d+)\)', r'"__DAYSAGO_\1__"', seeds_ts)
seeds_ts = re.sub(r'^\s*//[^\n]*$', '', seeds_ts, flags=re.MULTILINE)
seeds_ts = "[\n" + seeds_ts + "]"
seeds_ts = re.sub(r'([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\s*):', r'\1"\2"\3:', seeds_ts)
seeds_ts = re.sub(r',(\s*[\]\}])', r'\1', seeds_ts)

try:
    data = json.loads(seeds_ts)
    print(f"Parsed {len(data)} contacts")
    open("/root/misfits-web/src/lib/mock-contacts-seeds.json", "w").write(json.dumps(data, indent=2, ensure_ascii=False))
except json.JSONDecodeError as e:
    print("ERR:", e.msg, "line", e.lineno)
    lns = seeds_ts.split("\n")
    for i in range(max(0, e.lineno-3), min(len(lns), e.lineno+2)):
        print(f"  L{i+1}: {lns[i][:100]}")
    raise SystemExit(1)

loader = '''const seeds: Seed[] = ((): Seed[] => {
  const raw = seedsRawJson as unknown;
  const resolve = <T,>(v: T): T => {
    if (typeof v === "string") {
      const c = v.match(/^__COLOR_(\\d+)__$/);
      if (c) return color(Number(c[1])) as unknown as T;
      const d = v.match(/^__DAYSAGO_(\\d+)__$/);
      if (d) return daysAgo(Number(d[1])) as unknown as T;
      return v;
    }
    if (Array.isArray(v)) return v.map(resolve) as unknown as T;
    if (v && typeof v === "object") {
      const out: Record<string, unknown> = {};
      for (const [k, val] of Object.entries(v as Record<string, unknown>)) out[k] = resolve(val);
      return out as unknown as T;
    }
    return v;
  };
  return resolve(raw) as Seed[];
})();
'''

import_line = 'import seedsRawJson from "./mock-contacts-seeds.json";\n'
new = lines[:91] + [import_line, "\n", loader] + lines[606:]
open(p, "w").writelines(new)
print(f"mock-contacts.ts: {len(new)} lines (was {len(lines)})")
