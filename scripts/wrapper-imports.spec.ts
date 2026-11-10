import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';
// @ts-expect-error plain .mjs module without types
import { IMPORT_RULES, WRAPPERS, importUses } from './wrapper-imports.mjs';
// @ts-expect-error plain .mjs module without types
import { readBaselines } from './raw-elements.mjs';
// @ts-expect-error plain .mjs module without types
import { sourceTree } from './source-tree.mjs';

type Use = { rule: string; line: number };
const rules = (source: string, rel = 'features/x/XPage.vue') =>
  (importUses(source, rel) as Use[]).map(({ rule }) => rule);

describe('import rules', () => {
  it('count an import of every wrapper', () => {
    for (const { id, file } of WRAPPERS as Array<{ id: string; file: string }>) {
      expect(rules(`import Part from '@/${file}';`), id).toEqual([id]);
    }
  });

  it('count a wrapper re-exported by a kit barrel, but let the kit import PrimeVue', () => {
    const barrel = `export { default as AdminChip } from '@/features/admin/ui/AdminChip.vue'; export * from '@/features/admin/ui/controls';`;
    expect(rules(barrel, 'components/ui/zz-barrel.ts')).toEqual(['AdminChip', 'controls']);
  });

  it('fold ./, x/../ and ?query in an @/ path before matching', () => {
    for (const path of ['ui/./AdminChip.vue', 'ui/x/../AdminChip.vue', 'ui/AdminChip.vue?x']) {
      expect(rules(`import Chip from '@/features/admin/${path}';`), path).toEqual(['AdminChip']);
    }
  });

  it('count a direct PrimeVue part, but not its types or the kit wrapping it', () => {
    expect(rules(`import Dialog from 'primevue/dialog';`)).toEqual(['primevue']);
    expect(rules(`import type { MenuItem } from 'primevue/menuitem';`)).toEqual([]);
    expect(rules(`import Dialog from 'primevue/dialog';`, 'components/ui/Modal.vue')).toEqual([]);
  });

  it('match the resolved file, whatever the path is written as or the binding is named', () => {
    expect(
      rules(`import { INPUT as FIELD } from '../ui/controls';`, 'features/admin/x/X.vue'),
    ).toEqual(['controls']);
    expect(
      rules(`import Picker from './ChoiceCards.vue';`, 'features/admin/ui/form/Y.vue'),
    ).toEqual(['AdminChoiceCards']);
    expect(rules(`import ChoiceCards from '@/components/ui/ChoiceCards.vue';`)).toEqual([]);
  });

  it('count each use of what an import binds, in any tag case, so a listed file adds none unseen', () => {
    const source = [
      `<script setup lang="ts">`,
      `import Badge from '@/features/admin/ui/AdminChip.vue';`,
      `import { INPUT as FIELD } from '@/features/admin/ui/controls';`,
      `const look = [FIELD, item.FIELD];`,
      `</script>`,
      `<template><Badge>a</Badge><badge /><!-- <Badge /> --></template>`,
    ].join('\n');
    expect(rules(source)).toEqual(['AdminChip', 'AdminChip', 'controls']);
  });

  it('count a dynamic import and a re-export', () => {
    expect(
      rules(
        `const Panel = defineAsyncComponent(() => import('@/features/admin/ui/AdminDrawer.vue'));`,
      ),
    ).toEqual(['AdminDrawer']);
    expect(rules(`export { default } from '@/features/admin/ui/AdminChip.vue';`)).toEqual([
      'AdminChip',
    ]);
  });

  it('skip a commented-out import', () => {
    expect(rules(`// import Chip from '@/features/admin/ui/AdminChip.vue';`)).toEqual([]);
  });

  it('cannot be bypassed by a tag alone: nothing registers a component globally', () => {
    const registering = (sourceTree() as Array<{ rel: string; source: string }>).filter(
      ({ source }) => /\.component\(\s*['"`]/.test(source),
    );
    expect(registering.map(({ rel }) => rel)).toEqual([]);
  });
});

describe('the ESLint import blocks', () => {
  const eslint = new ESLint();
  const patterns = async (path: string): Promise<string[]> => {
    const config = (await eslint.calculateConfigForFile(path)) as {
      rules: Record<string, [string, { patterns: Array<{ regex: string }> }?]>;
    };
    return config.rules['no-restricted-imports']?.[1]?.patterns.map(({ regex }) => regex) ?? [];
  };
  const regexOf = (id: string) =>
    (IMPORT_RULES as Array<{ id: string; regex: string }>).find((rule) => rule.id === id)!.regex;

  it('refuse every rule to a new file, and to a listed file only the wrappers it does not count', async () => {
    expect(await patterns('src/features/x/NewPage.vue')).toHaveLength(IMPORT_RULES.length);
    const merged = readBaselines().merged as Record<string, Record<string, number>>;
    const [listed] = Object.entries(merged).find(
      ([, counts]) => counts.AdminChip && !counts.AdminNotice,
    )!;
    const refused = await patterns(`src/${listed}`);
    expect(refused).not.toContain(regexOf('AdminChip'));
    expect(refused).toContain(regexOf('AdminNotice'));
  }, 60_000);
});
