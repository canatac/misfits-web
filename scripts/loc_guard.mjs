#!/usr/bin/env node
// Garde-fou LOC progressif. THRESHOLD_STRICT = seuil bloquant, THRESHOLD_WARN = signalement.
import { execSync } from 'child_process';
const THRESHOLD_STRICT = parseInt(process.env.LOC_STRICT || '500', 10);
const THRESHOLD_WARN = parseInt(process.env.LOC_WARN || '300', 10);
const out = execSync(`find src -type f \\( -name '*.ts' -o -name '*.tsx' \\) -exec wc -l {} +`, { encoding: 'utf8' });
const rows = out.split('\n').filter(l => l.trim() && !l.includes('total')).map(l => l.trim().split(/\s+/));
const strict = rows.filter(([n]) => parseInt(n) > THRESHOLD_STRICT);
const warn = rows.filter(([n]) => parseInt(n) > THRESHOLD_WARN && parseInt(n) <= THRESHOLD_STRICT);
if (warn.length) console.warn(`⚠️ ${warn.length} fichiers > ${THRESHOLD_WARN} LOC (cible progressive) :\n${warn.map(([n,p]) => `  ${n}\t${p}`).join('\n')}`);
if (strict.length) { console.error(`❌ ${strict.length} fichiers > ${THRESHOLD_STRICT} LOC :\n${strict.map(([n,p]) => `  ${n}\t${p}`).join('\n')}`); process.exit(1); }
console.log(`✅ Aucun fichier > ${THRESHOLD_STRICT} LOC (${warn.length} en warning entre ${THRESHOLD_WARN}-${THRESHOLD_STRICT})`);
