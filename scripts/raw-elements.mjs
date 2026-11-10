// The raw-element ratchet (docs/wrapper-migration.md). The kit (src/components/ui/) has a part for every raw element,
// old wrapper and retired class the rules in scripts/raw-element-rules.mjs count. Each area of the app (one M lane of
// the UX plan) has a baseline, scripts/raw-element-baseline/<area>.json: `{ "<path under src>": { "<rule>": count } }`,
// the uses each file had on 2026-11-10. `npm run lint:tokens` fails when a file has more uses of a rule than its count
// (an unlisted file has none), and when it has fewer, so a fix lowers the count in the same change:
// `npm run raw-elements:shrink` rewrites the baselines down to the real counts and never raises or adds one.
// scripts/raw-elements.first.json keeps the first baselines; scripts/raw-elements.spec.ts fails when a baseline holds
// a file or a count the first one does not, so the lists only shrink.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CLASS_RULES, ELEMENT_RULES, ruleUses } from './raw-element-rules.mjs';
import { sourceTree } from './source-tree.mjs';
import { IMPORT_RULES } from './wrapper-imports.mjs';

export const BASELINE_DIR = fileURLToPath(new URL('./raw-element-baseline/', import.meta.url));

/** Areas by baseline file: the M lane that shrinks it and the paths under src/ it covers (the first match wins). */
export const AREAS = [
  [
    'problems-submissions',
    'M-PS',
    [
      'features/problems/',
      'features/submissions/',
      'features/runtimes/',
      'features/external-judge/',
    ],
  ],
  ['contests', 'M-CT', ['features/contests/', 'features/leaderboard/', 'features/official-mode/']],
  [
    'shell-home',
    'M-SH',
    [
      'features/shell/',
      'features/home/',
      'features/community/',
      'features/site-notice/',
      'features/not-found/',
      'features/flatpages/',
      'features/bit-roam/',
      'features/short-links/',
      'features/appearance/',
    ],
  ],
  ['auth-account', 'M-AU', ['features/auth/', 'features/account/']],
  ['profile-notifications', 'M-PR', ['features/profile/', 'features/notifications/']],
  ['blog-comments', 'M-BC', ['features/blog/', 'features/comments/', 'features/vote/']],
  ['organizations-tickets', 'M-OT', ['features/organizations/', 'features/tickets/']],
  [
    'admin-problems',
    'M-AP',
    [
      'features/admin/problems/',
      'features/admin/creation/',
      'features/admin/edit-link/',
      'features/admin/search/',
    ],
  ],
  [
    'admin-tools',
    'M-AT',
    [
      'features/admin/rejudge/',
      'features/admin/similarity/',
      'features/admin/submissions/',
      'features/admin/shell/',
      'features/admin/ui/',
    ],
  ],
  ['admin-contests-users', 'M-A2a', ['features/admin/contests/', 'features/admin/users/']],
  [
    'admin-site',
    'M-A2b',
    [
      'features/admin/settings/',
      'features/admin/organizations/',
      'features/admin/judges/',
      'features/admin/languages/',
      'features/admin/pages/',
      'features/admin/site/',
      'features/admin/catalogs/',
      'features/admin/contest-tags/',
    ],
  ],
  [
    'admin-moderation',
    'M-A2c',
    [
      'features/admin/comments/',
      'features/admin/posts/',
      'features/admin/tickets/',
      'features/admin/audit/',
      'features/admin/activity/',
      'features/admin/short-links/',
      'features/admin/integrations/',
      'features/admin/canned-replies/',
    ],
  ],
  ['shared', 'the lane that edits the file', ['']],
];

/** The baseline file (area) of a path under src/. */
export const areaOf = (rel) =>
  AREAS.find(([, , prefixes]) => prefixes.some((prefix) => rel.startsWith(prefix)))[0];

/** What to use instead, by rule id. */
export const KIT_PART = {
  ...ELEMENT_RULES,
  ...Object.fromEntries(IMPORT_RULES.map(({ id, use }) => [id, use])),
  ...Object.fromEntries(Object.entries(CLASS_RULES).map(([id, { use }]) => [id, use])),
};

/** Every area baseline from `dir`, merged: `{ rel: { rule: count } }`, and which file each entry came from. */
export function readBaselines(dir = BASELINE_DIR) {
  const merged = {};
  const sourceOf = {};
  for (const name of readdirSync(dir).filter((file) => file.endsWith('.json'))) {
    for (const [rel, counts] of Object.entries(JSON.parse(readFileSync(join(dir, name), 'utf8')))) {
      merged[rel] = counts;
      sourceOf[rel] = name.replace(/\.json$/, '');
    }
  }
  return { merged, sourceOf };
}

/** Uses per rule: `{ rule: count }`. */
export const countUses = (uses) =>
  uses.reduce((counts, { rule }) => ({ ...counts, [rule]: (counts[rule] ?? 0) + 1 }), {});

const where = (rel) => `scripts/raw-element-baseline/${areaOf(rel)}.json`;

/**
 * The lint finding of one file against its baseline counts (`allowed`, `{ rule: count }`): every use of a rule the file
 * has more of than allowed, and one line per rule it has fewer of (the count must come down).
 */
export function rawElementOffences(source, rel, allowed = {}) {
  const uses = ruleUses(source, rel);
  const counts = countUses(uses);
  const over = uses.filter(({ rule }) => counts[rule] > (allowed[rule] ?? 0));
  const under = Object.entries(allowed).filter(([rule, count]) => (counts[rule] ?? 0) < count);
  return [
    ...over.map(({ rule, line, text }) => ({
      line,
      text: `${text} (${rule}: ${counts[rule]} > ${allowed[rule] ?? 0} allowed; use ${KIT_PART[rule]})`,
    })),
    ...under.map(([rule, count]) => ({
      line: 1,
      text: `${rule}: ${counts[rule] ?? 0} left, ${count} in ${where(rel)}: run npm run raw-elements:shrink`,
    })),
  ];
}

/** Baseline entries that point nowhere: a file that is gone, a file in another area's baseline, an unknown rule. */
export function baselineErrors({ merged, sourceOf }, rels) {
  const present = new Set(rels);
  return Object.entries(merged).flatMap(([rel, counts]) => [
    ...(present.has(rel) ? [] : [`${rel}: no such file: run npm run raw-elements:shrink`]),
    ...(sourceOf[rel] === areaOf(rel)
      ? []
      : [`${rel}: listed in ${sourceOf[rel]}.json, belongs in ${areaOf(rel)}.json`]),
    ...Object.keys(counts)
      .filter((rule) => !(rule in KIT_PART))
      .map((rule) => `${rel}: unknown rule ${rule}`),
  ]);
}

const sorted = (object) =>
  Object.fromEntries(Object.entries(object).sort(([first], [second]) => (first < second ? -1 : 1)));

/** One area baseline lowered to the real counts (`actual`, `{ rel: { rule: count } }`); never raises or adds a count. */
export function shrunk(baseline, actual) {
  const lowered = Object.entries(baseline).map(([rel, counts]) => [
    rel,
    sorted(
      Object.fromEntries(
        Object.entries(counts)
          .map(([rule, count]) => [rule, Math.min(count, actual[rel]?.[rule] ?? 0)])
          .filter(([, count]) => count > 0),
      ),
    ),
  ]);
  return sorted(Object.fromEntries(lowered.filter(([, counts]) => Object.keys(counts).length)));
}

/** `node scripts/raw-elements.mjs --shrink`: rewrites every area baseline down to the real counts of src/. */
function shrinkAll() {
  const actual = Object.fromEntries(
    sourceTree().map(({ rel, source }) => [rel, countUses(ruleUses(source, rel))]),
  );
  for (const name of readdirSync(BASELINE_DIR).filter((file) => file.endsWith('.json'))) {
    const path = join(BASELINE_DIR, name);
    const lowered = shrunk(JSON.parse(readFileSync(path, 'utf8')), actual);
    writeFileSync(path, `${JSON.stringify(lowered, null, 2)}\n`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url) && process.argv[2] === '--shrink')
  shrinkAll();
