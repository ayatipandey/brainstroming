// Lists the license of every package that ships with the app (production
// dependencies of client, server and root) and flags anything that is not a
// common permissive license. Run: node scripts/license-check.mjs
import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const OK = /^(MIT|ISC|BSD-2-Clause|BSD-3-Clause|Apache-2\.0|0BSD|OFL-1\.1|CC0-1\.0|BlueOak-1\.0\.0|Unlicense|Python-2\.0|CC-BY-4\.0)$/;
const rows = [];
for (const dir of ['client', 'server', '.']) {
  let tree;
  try { tree = JSON.parse(execSync('npm ls --omit=dev --all --json', { cwd: dir, stdio: ['ignore', 'pipe', 'ignore'] }).toString()); } catch (e) { tree = JSON.parse(e.stdout.toString()); }
  const walk = (deps = {}) => {
    for (const [name, info] of Object.entries(deps)) {
      const pj = path.join(dir, 'node_modules', name, 'package.json');
      let license = 'unknown';
      if (existsSync(pj)) { const p = JSON.parse(readFileSync(pj, 'utf8')); license = typeof p.license === 'string' ? p.license : p.license?.type || (p.licenses || []).map((l) => l.type).join(' OR ') || 'unknown'; }
      rows.push({ where: dir === '.' ? 'root' : dir, name, version: info.version, license });
      walk(info.dependencies);
    }
  };
  walk(tree.dependencies);
}
const uniq = [...new Map(rows.map((r) => [`${r.name}@${r.version}`, r])).values()].sort((a, b) => a.name.localeCompare(b.name));
const flagged = uniq.filter((r) => !r.license.split(/ OR | AND |[()]/).filter(Boolean).every((l) => OK.test(l.trim())));
console.log(`${uniq.length} production packages.`);
const counts = {};
uniq.forEach((r) => { counts[r.license] = (counts[r.license] || 0) + 1; });
console.log('By license:', JSON.stringify(counts));
console.log(flagged.length ? `Needs review:\n${flagged.map((r) => `  ${r.name}@${r.version} (${r.where}): ${r.license}`).join('\n')}` : 'No packages outside the permissive list.');
