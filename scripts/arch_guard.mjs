#!/usr/bin/env node
// Architecture guard — Boucle 14 (misfits-web)
// Vérifie que les dépendances entre couches respectent la discipline hexagonale:
//
//   app/api/        (server route handlers)
//     ↓ ne doit PAS importer components/
//   components/     (React UI, presentation)
//     ↓ ne doit PAS importer directement lib/repositories/ (data access)
//        (doit passer par stores/ ou hooks/ ou lib/api-client)
//   stores/, hooks/ (state / view-model)
//     ↓ ne doivent PAS importer components/ (cycle)
//   lib/repositories/ = seul point d'accès data (via api-client)
//
// Aucun 'npm install' ajouté — pure Node stdlib, exécutable en CI sur checkout.
//
// Chaque règle produit un rapport (fichier + ligne + import) et code exit ≠ 0.

import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT = path.resolve(process.cwd(), "src");

async function walk(dir) {
    const out = [];
    let entries;
    try {
        entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
        return out;
    }
    for (const e of entries) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) {
            if (e.name === "__tests__" || e.name === "node_modules") continue;
            out.push(...(await walk(p)));
        } else if (/\.(ts|tsx|mts|cts)$/.test(e.name)) {
            out.push(p);
        }
    }
    return out;
}

async function scanImports(files) {
    const results = [];
    for (const f of files) {
        const src = await fs.readFile(f, "utf8");
        // Deux patterns pour distinguer type-only (n'introduit pas de dépendance runtime)
        // du reste. On tolère 'import type { ... } from "..."' vers components.
        const rx = /(import\s+type\s+[^"']+from\s+|from\s+)["']([^"']+)["']/g;
        let m;
        while ((m = rx.exec(src)) !== null) {
            const isTypeOnly = /import\s+type\s+/.test(m[1]);
            results.push({
                file: f,
                imported: m[2],
                line: src.slice(0, m.index).split("\n").length,
                typeOnly: isTypeOnly,
            });
        }
    }
    return results;
}

function isViolation(rule, imp) {
    // type-only imports = pas de couplage runtime, tolérés si rule.allowTypeOnly.
    if (imp.typeOnly && rule.allowTypeOnly) return false;
    return rule.forbidPrefix.some((pref) => imp.imported.startsWith(pref));
}

const RULES = [
    {
        name: "app/api → components",
        scanDir: path.join(ROOT, "app", "api"),
        forbidPrefix: ["@/components", "../../../components", "../../components", "../components"],
        why: "Route handlers ne doivent pas importer de composants React.",
    },
    {
        name: "components → lib/repositories",
        scanDir: path.join(ROOT, "components"),
        forbidPrefix: ["@/lib/repositories"],
        why: "Composants doivent passer par stores/hooks/api-client, pas directement par repositories.",
    },
    {
        name: "stores → components",
        scanDir: path.join(ROOT, "stores"),
        forbidPrefix: ["@/components"],
        allowTypeOnly: true,
        why: "Stores ne doivent pas dépendre de composants (cycle).",
    },
    {
        name: "hooks → components",
        scanDir: path.join(ROOT, "hooks"),
        forbidPrefix: ["@/components"],
        allowTypeOnly: true,
        why: "Hooks ne doivent pas dépendre de composants (cycle runtime).",
    },
];

let total = 0;
const violationsByRule = [];

for (const rule of RULES) {
    const files = await walk(rule.scanDir);
    const imports = await scanImports(files);
    const violations = imports.filter((i) => isViolation(rule, i));
    if (violations.length > 0) {
        violationsByRule.push({ rule, violations });
        total += violations.length;
    }
}

if (total === 0) {
    console.log("✅ Architecture guard: discipline hexagonale respectée.");
    process.exit(0);
}

console.error(`❌ Architecture guard: ${total} violation(s) détectée(s).\n`);
for (const { rule, violations } of violationsByRule) {
    console.error(`— Règle: ${rule.name}`);
    console.error(`  ${rule.why}`);
    for (const v of violations) {
        console.error(`    ${path.relative(process.cwd(), v.file)}:${v.line}  imports  "${v.imported}"`);
    }
    console.error();
}
process.exit(1);
