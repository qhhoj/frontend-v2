// Fails `npm run lint` when code that runs outside the admin area names an admin text area that is not in
// src/i18n/admin/shared/. Those areas load only when an admin page opens (`loadAdminMessages`), so a public page
// would show the raw key. Fix: move the keys it uses into a shared area, or stop importing the admin part.
// Reach: every static and dynamic import from src/main.ts, except the admin pages' own entries (ADMIN_ENTRIES).
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const src = join(root, 'src');
const adminTexts = join(src, 'i18n/admin');
/** Files whose dynamic imports under features/admin/ open admin pages: the screen routes and the admin layout. */
const ADMIN_ENTRIES = ['src/features/admin/admin-routes.ts', 'src/features/shell/AppShell.vue'];
const STATIC_IMPORT = /^\s*(?:import|export)\s+(?!type\b)(?:[^'";]*?\sfrom\s+)?['"]([^'"]+)['"]/gm;
const DYNAMIC_IMPORT = /import\(\s*['"]([^'"]+)['"]\s*\)/g;

function resolveImport(from, spec) {
  const base = spec.startsWith('@/') ? join(src, spec.slice(2)) : spec.startsWith('.') ? resolve(dirname(from), spec) : null;
  if (!base) return null;
  const hit = ['', '.ts', '.vue', '/index.ts'].map((ext) => base + ext).find((path) => existsSync(path) && statSync(path).isFile());
  return hit && /\.(?:ts|vue)$/.test(hit) ? hit : null;
}

function importsOf(file, text) {
  const isEntry = ADMIN_ENTRIES.includes(relative(root, file));
  const targets = [...text.matchAll(STATIC_IMPORT)].map((m) => resolveImport(file, m[1]));
  for (const m of text.matchAll(DYNAMIC_IMPORT)) {
    const target = resolveImport(file, m[1]);
    if (!(isEntry && target?.includes('/features/admin/'))) targets.push(target);
  }
  return targets.filter(Boolean);
}

/** Area name -> first public file that names it. */
function publicAreas() {
  const areas = new Map();
  const seen = new Set();
  const queue = [join(src, 'main.ts')];
  while (queue.length) {
    const file = queue.pop();
    if (seen.has(file)) continue;
    seen.add(file);
    const text = readFileSync(file, 'utf8');
    for (const m of text.matchAll(/\badmin\.(\w+)/g)) if (!areas.has(m[1])) areas.set(m[1], file);
    queue.push(...importsOf(file, text));
  }
  return areas;
}

const areaNames = (dir) => new Set(readdirSync(dir).filter((n) => n.endsWith('.json')).map((n) => n.split('.')[0]));
const adminOnly = areaNames(adminTexts);
const offences = [...publicAreas()]
  .filter(([area]) => adminOnly.has(area))
  .map(([area, file]) => `admin.${area} (src/i18n/admin/${area}.*.json) named by ${relative(root, file)}`);

if (offences.length) {
  console.error(`Public code names admin-only text areas (move the keys to src/i18n/admin/shared/):\n${offences.join('\n')}`);
  process.exit(1);
}
