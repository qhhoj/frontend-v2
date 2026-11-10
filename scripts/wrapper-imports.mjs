// Imports that bypass the src/components/ui/ kit (docs/wrapper-migration.md): the thin wrappers kept for old call sites, and
// PrimeVue parts used directly. Each is a rule of the raw-element ratchet (scripts/raw-elements.mjs): a file may keep the
// imports its area baseline (scripts/raw-element-baseline/<area>.json) counts, and gains none. eslint.config.js turns the
// same rules into `no-restricted-imports` so the editor flags a new import as it is typed; a file listed for one wrapper
// is still refused the others. Specs and the kit itself are not checked.

/** A wrapper rule: the wrapper's file under src/, and the kit part that replaces it. */
const wrapper = (id, file, use, eslintTail) => ({ id, file, use, eslintTail });

/** The thin wrappers, by rule id. `eslintTail` (default: the file name) is what an import path ends with. */
export const WRAPPERS = [
  wrapper(
    'controls',
    'features/admin/ui/controls.ts',
    'AppButton/IconButton, TextInput/TextArea/SelectField, Card',
  ),
  wrapper('AdminField', 'features/admin/ui/AdminField.vue', 'FormField with a kit input'),
  wrapper('AdminChip', 'features/admin/ui/AdminChip.vue', 'Chip'),
  wrapper('AdminDataTable', 'features/admin/ui/table/AdminDataTable.vue', 'DataTable'),
  wrapper('AdminPageHeader', 'features/admin/ui/AdminPageHeader.vue', 'PageHeader'),
  wrapper('AdminNotice', 'features/admin/ui/feedback/AdminNotice.vue', 'Notice'),
  wrapper('GlassCard', 'components/GlassCard.vue', 'Card'),
  wrapper('AdminDrawer', 'features/admin/ui/AdminDrawer.vue', 'Drawer'),
  wrapper('AdminRowMenu', 'features/admin/ui/table/AdminRowMenu.vue', 'RowMenu'),
  wrapper(
    'AdminChoiceCards',
    'features/admin/ui/form/ChoiceCards.vue',
    'ChoiceCards (components/ui)',
    'form/ChoiceCards',
  ),
  wrapper(
    'AdminDateTimeField',
    'features/admin/ui/form/AdminDateTimeField.vue',
    'DateTimeField scale="admin"',
  ),
  wrapper('AdminUserLabel', 'features/admin/ui/AdminUserLabel.vue', 'UserLink'),
  wrapper('SettingsNotice', 'features/account/settings/SettingsNotice.vue', 'Notice'),
  wrapper('AuthNotice', 'features/auth/AuthNotice.vue', 'Notice'),
  wrapper(
    'use-admin-toast',
    'features/admin/ui/feedback/use-admin-toast.ts',
    'useToast (components/ui/use-toast)',
  ),
  wrapper('admin-toasts', 'features/admin/ui/feedback/admin-toasts.ts', 'components/ui/toasts'),
  wrapper('PillTabs', 'components/PillTabs.vue', 'Tabs'),
  wrapper('SubmissionPager', 'features/submissions/SubmissionPager.vue', 'NumberedPager'),
  wrapper('AuthField', 'features/auth/AuthField.vue', 'FormField with TextInput or PasswordInput'),
  wrapper('AuthSelect', 'features/auth/AuthSelect.vue', 'FormField with SelectField'),
  wrapper('SettingsCard', 'features/account/settings/SettingsCard.vue', 'Card'),
  wrapper('CommunityCard', 'features/community/CommunityCard.vue', 'Card with QueryState'),
];

/** PrimeVue parts other than the config and its types are wrapped by the kit. */
const PRIMEVUE = {
  id: 'primevue',
  use: 'the kit part over it: Modal/ConfirmDialog (dialog), Menu/RowMenu (menu), Drawer, Popover, ComboBox (select)',
  bare: /^primevue\/(?!config$|menuitem$)/,
};

const EXTENSION = /\.(?:vue|ts|js|mjs)$/;
const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Every import rule: `test` takes an import path resolved under src/ (or a bare package name). */
export const IMPORT_RULES = [
  ...WRAPPERS.map(({ id, file, use, eslintTail }) => ({
    id,
    use,
    test: (resolved) => resolved.replace(EXTENSION, '') === file.replace(EXTENSION, ''),
    regex: `(^|/)${escape(eslintTail ?? file.replace(/^.*\//, '').replace(EXTENSION, ''))}(\\.(vue|ts|js))?$`,
  })),
  { ...PRIMEVUE, test: (resolved) => PRIMEVUE.bare.test(resolved), regex: PRIMEVUE.bare.source },
];

/** The kit imports PrimeVue and never a wrapper, so it is not checked. */
export const isKit = (rel) => rel.startsWith('components/ui/');

/** An import path as a path under src/: `@/x` and `./x`/`../x` (from the file `rel`) resolve; a package name stays. */
export function resolveImport(path, rel) {
  if (path.startsWith('@/')) return path.slice(2);
  if (!path.startsWith('.')) return path;
  const parts = rel.split('/').slice(0, -1);
  for (const part of path.split('/')) {
    if (part === '..') parts.pop();
    else if (part !== '.') parts.push(part);
  }
  return parts.join('/');
}

/** `from '...'`, a bare `import '...'` and a dynamic `import('...')`. Comments are blanked before. */
const IMPORT_PATH = /\b(?:from|import)\s*\(?\s*(['"`])([^'"`]+)\1/g;
/** A static import with bindings: `import X, { a as B, type C } from '...'`, `import * as NS from '...'`. */
const STATIC_IMPORT = /\bimport\s+(?:type\s+)?([\w$\s{},*]+?)\s+from\s*(['"])([^'"]+)\2/g;
const COMMENT = /<!--[\s\S]*?-->|\/\*[\s\S]*?\*\/|(^|[^:'"\\])\/\/.*$/gm;
const blank = (text) => text.replace(/[^\n]/g, ' ');
/** The source with its comments as spaces (lines kept); the character before a `//` stays. */
const withoutComments = (source) =>
  source.replace(COMMENT, (comment, lead = '') => lead + blank(comment.slice(lead.length)));
const lineOf = (source, index) => source.slice(0, index).split('\n').length;

/** The local names an import clause binds: the default, each named one (its `as` name) and a namespace. */
const boundNames = (clause) =>
  clause
    .replace(/[{}]/g, ',')
    .split(',')
    .map((part) => /(?:^|\s)([\w$]+)\s*$/.exec(part.trim())?.[1])
    .filter((name) => name && name !== 'type');

const kebab = (name) => name.replace(/(?<=[a-z0-9])([A-Z])/g, '-$1').toLowerCase();
const escapeName = (name) => name.replace(/\$/g, '\\$');

/**
 * Where a file uses the names an import binds, outside the import: a reference or opening tag (`<Badge`, and
 * `<badge-name` for a PascalCase name); a closing tag, a property (`x.Name`) or a path (`/Name.vue`) does not count.
 */
function nameUses(code, names) {
  return names.flatMap((name) => {
    const forms = [`(?<![\\w$./-])${escapeName(name)}(?![\\w$-])`];
    if (/^[A-Z]/.test(name)) forms.push(`<${kebab(name)}(?![\\w-])`);
    return [...code.matchAll(new RegExp(forms.join('|'), 'g'))].map((match) => ({
      index: match.index,
      name,
    }));
  });
}

/** The rule an import path breaks for the file `rel`, or undefined. */
const ruleOf = (path, rel) => IMPORT_RULES.find(({ test }) => test(resolveImport(path, rel)));

/** One use per reference to what a static import binds (at least the import itself): a listed file adds none unseen. */
function staticUses(code, rel) {
  const imports = [...code.matchAll(STATIC_IMPORT)].filter((match) => ruleOf(match[3], rel));
  const rest = imports.reduce(
    (text, match) =>
      text.slice(0, match.index) + blank(match[0]) + text.slice(match.index + match[0].length),
    code,
  );
  const uses = imports.flatMap((match) => {
    const rule = ruleOf(match[3], rel).id;
    const named = nameUses(rest, boundNames(match[1]));
    const at = named.length ? named : [{ index: match.index, name: match[3] }];
    return at.map(({ index, name }) => ({ rule, line: lineOf(code, index), text: name }));
  });
  return { uses, rest };
}

/**
 * Every use of one file that an import rule refuses, as `{ rule, line, text }`: each use of what a static import binds
 * (its import when unused), and each dynamic import, re-export or bare import.
 */
export function importUses(source, rel) {
  if (isKit(rel)) return [];
  const { uses, rest } = staticUses(withoutComments(source), rel);
  const others = [...rest.matchAll(IMPORT_PATH)].flatMap((match) => {
    const rule = ruleOf(match[2], rel);
    return rule ? [{ rule: rule.id, line: lineOf(rest, match.index), text: match[2] }] : [];
  });
  return [...uses, ...others];
}

const restricted = (rules) => [
  'error',
  {
    patterns: rules.map(({ regex, use }) => ({
      regex,
      message: `Use ${use} instead (src/components/ui; docs/wrapper-migration.md).`,
    })),
  },
];

/**
 * ESLint flat-config blocks: every app file is refused every import rule, and a file whose baseline counts some imports
 * is refused all the others. A later block replaces the rule's options, so each file gets exactly one list.
 * `baseline` is `{ '<path under src>': { '<rule id>': count } }`.
 */
export function eslintImportBlocks(baseline) {
  const groups = new Map();
  for (const [rel, counts] of Object.entries(baseline)) {
    const allowed = IMPORT_RULES.filter(({ id }) => counts[id] > 0).map(({ id }) => id);
    if (!allowed.length) continue;
    const key = allowed.join(' ');
    groups.set(key, [...(groups.get(key) ?? []), `src/${rel}`]);
  }
  const base = {
    files: ['src/**/*.{ts,vue}'],
    ignores: ['src/**/*.spec.ts', 'src/components/ui/**'],
    rules: { 'no-restricted-imports': restricted(IMPORT_RULES) },
  };
  return [
    base,
    ...[...groups].map(([key, files]) => ({
      files,
      rules: {
        'no-restricted-imports': restricted(
          IMPORT_RULES.filter(({ id }) => !key.split(' ').includes(id)),
        ),
      },
    })),
  ];
}
