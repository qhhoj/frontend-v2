import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
// @ts-expect-error plain .mjs module without types
import { classUses, elementUses } from './raw-element-rules.mjs';
import {
  baselineErrors,
  rawElementOffences,
  readBaselines,
  shrunk,
  // @ts-expect-error plain .mjs module without types
} from './raw-elements.mjs';

type Use = { rule: string; line: number; text: string };
type Counts = Record<string, Record<string, number>>;
const elements = (template: string, script = '') =>
  (elementUses(`${script}<template>\n${template}\n</template>`, 'features/x/X.vue') as Use[]).map(
    ({ rule }) => rule,
  );
const classes = (line: string, rel = 'features/x/X.vue') =>
  (classUses(line, rel) as Use[]).map(({ rule }) => rule);

describe('element rules', () => {
  it.each([
    ['button', '<button type="button">x</button>'],
    ['button', '<input type="submit" />'],
    ['input', '<input v-model="name" />'],
    ['input', '<input :type="kind" />'],
    ['search', '<input type="search" />'],
    ['password', '<input type="password" />'],
    ['checkbox', '<input type="checkbox" />'],
    ['radio', '<input type="radio" />'],
    ['file', '<input type="file" hidden />'],
    ['select', '<select v-model="pick"></select>'],
    ['textarea', '<textarea v-model="body" />'],
    ['table', '<table class="w-full"></table>'],
    ['details', '<details><summary>x</summary></details>'],
    ['dialog', '<dialog ref="sheet"></dialog>'],
  ])('%s: %s', (rule, template) => {
    expect(elements(template)).toEqual([rule]);
  });

  it('let range and hidden inputs pass: the kit has no part for them', () => {
    expect(elements('<input type="range" /><input type="hidden" />')).toEqual([]);
  });

  it('count a tag in any letter case, but not a component bound to that name', () => {
    expect(elements('<BUTTON>x</BUTTON><Textarea />')).toEqual(['button', 'textarea']);
    expect(elements('<Select />', `<script setup>import Select from './S.vue';</script>`)).toEqual(
      [],
    );
  });

  it('count a dynamic component that renders a raw element', () => {
    expect(elements(`<component :is="link ? 'a' : 'button'" />`)).toEqual(['button']);
    expect(elements('<component is="textarea" />')).toEqual(['textarea']);
    expect(elements('<component :is="icon" />')).toEqual([]);
  });

  it('read a whole tag, with a > inside an attribute value', () => {
    expect(elements('<input :disabled="count > 1" type="checkbox" />')).toEqual(['checkbox']);
  });

  it('skip comments, scripts and non-vue files', () => {
    expect(
      elements('<!-- <button>old</button> -->', `<script>const html = '<button>';</script>`),
    ).toEqual([]);
    expect(elementUses(`const html = '<button>';`, 'features/x/x.ts')).toEqual([]);
  });

  it('leave the kit alone', () => {
    expect(elementUses('<template><button /></template>', 'components/ui/AppButton.vue')).toEqual(
      [],
    );
  });
});

describe('class rules', () => {
  it.each([
    ['uppercase', `<p class="text-caption uppercase">`],
    ['fixed-size', `<Icon class="size-[18px]" />`],
    ['fixed-size', `const SHELL = 'min-h-[24.4rem]';`],
    ['disabled-opacity', `<button class="disabled:opacity-60">`],
    ['disabled-opacity', `<a class="aria-disabled:opacity-50">`],
    ['disabled-opacity', `<a :class="{ 'opacity-50': disabled }">`],
    ['disabled-opacity', `<a :class="[base, disabled && 'opacity-50']">`],
    ['uppercase', `<p :class="{ uppercase: shout }">`],
    ['verdict-tone', `<span class="text-verdict-ac">`],
  ])('%s: %s', (rule, line) => {
    expect(classes(line)).toEqual([rule]);
  });

  it('let verdict parts use the verdict colours', () => {
    expect(classes(`const AC = 'text-verdict-ac';`, 'lib/verdicts.ts')).toEqual([]);
  });

  it('let opacity pass when no disabled state is named, or it is the control own attribute', () => {
    expect(classes(`<a :disabled="disabled" class="opacity-50">`)).toEqual([]);
    expect(classes(`<a :class="{ 'opacity-50': dimmed }">`)).toEqual([]);
  });

  it('skip comment lines', () => {
    expect(classes(`<!-- <p class="uppercase"> -->`)).toEqual([]);
  });
});

describe('rawElementOffences', () => {
  const two = '<template><button /><button /></template>';

  it('let a listed file keep its count, but not add one', () => {
    expect(rawElementOffences(two, 'features/x/X.vue', { button: 2 })).toEqual([]);
    expect(rawElementOffences(two, 'features/x/X.vue', { button: 1 })).toHaveLength(2);
  });

  it('allow none in an unlisted file, and name the kit part', () => {
    const [offence] = rawElementOffences(two, 'features/x/X.vue') as Use[];
    expect(offence.text).toContain('use AppButton or IconButton');
  });

  it('fail a file that has fewer than its count, so a fix lowers it', () => {
    const [offence] = rawElementOffences(two, 'features/x/X.vue', { button: 3 }) as Use[];
    expect(offence.text).toContain('raw-elements:shrink');
  });
});

describe('the baselines', () => {
  it('shrink only: a count goes down to the real one or the entry goes, and nothing is added', () => {
    const baseline = { 'a.vue': { button: 3, table: 1 }, 'b.vue': { input: 1 } };
    const actual = { 'a.vue': { button: 2, select: 4 }, 'b.vue': {}, 'c.vue': { button: 1 } };
    expect(shrunk(baseline, actual)).toEqual({ 'a.vue': { button: 2 } });
  });

  it('flag an entry for a missing file or in the wrong area file', () => {
    const merged = {
      'features/blog/Gone.vue': { button: 1 },
      'features/tickets/T.vue': { table: 1 },
    };
    const sourceOf = {
      'features/blog/Gone.vue': 'blog-comments',
      'features/tickets/T.vue': 'shared',
    };
    expect(baselineErrors({ merged, sourceOf }, ['features/tickets/T.vue'])).toHaveLength(2);
  });

  it('never gain a file or a count over the first baselines, which stay as written', () => {
    const first = readFileSync(new URL('./raw-elements.first.json', import.meta.url), 'utf8');
    const hash = createHash('sha256').update(first).digest('hex');
    expect(
      hash,
      `raw-elements.first.json changed. Only a rule that now sees more uses may change it: regenerate it (recipe in docs/wrapper-migration.md), then paste the output of \`sha256sum scripts/raw-elements.first.json\` here`,
    ).toBe('798c3dc88d1f0af6b1fd09f40e8cfb7eceb6fc12216ed877ed1c67dc58219d1b');
    const firstCounts = JSON.parse(first) as Counts;
    const merged = readBaselines().merged as Counts;
    const grown = Object.entries(merged).flatMap(([rel, counts]) =>
      Object.entries(counts)
        .filter(([rule, count]) => count > (firstCounts[rel]?.[rule] ?? 0))
        .map(([rule]) => `${rel} ${rule}`),
    );
    expect(grown).toEqual([]);
  });
});
