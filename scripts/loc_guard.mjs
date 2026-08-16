#!/usr/bin/env node
import { execSync } from 'child_process';
const THRESHOLD = 300;
const out = execSync(`find src -type f \\( -name '*.ts' -o -name '*.tsx' \\) -exec wc -l {} +`, { encoding: 'utf8' });
const over = out.split('\n').filter(l => l.trim() && !l.includes('total')).map(l => l.trim().split(/\s+/)).filter(([n]) => parseInt(n) > THRESHOLD);
if (over.length) {
  console.error(`❌ ${over.length} fichiers > ${THRESHOLD} LOC :\n${over.map(([n,p]) => `  ${n}\t${p}`).join('\n')}`);
  process.exit(1);
}
console.log(`✅ Aucun fichier > ${THRESHOLD} LOC`);
