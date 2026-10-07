import { describe, expect, it } from 'vitest';
import { i18n, translate } from '@/i18n';
import { THEMES } from '@/theme/registry';
import en from './en.json';
import vi from './vi.json';

type Messages = { [key: string]: string | Messages };
const flatten = (messages: Messages, prefix = ''): Record<string, string> =>
  Object.fromEntries(
    Object.entries(messages).flatMap(([key, value]) =>
      typeof value === 'string'
        ? [[`${prefix}${key}`, value]]
        : Object.entries(flatten(value, `${prefix}${key}.`)),
    ),
  );
/** One entry per `|` plural form; each is the form's sorted set of placeholder names. */
const placeholderSets = (message: string) =>
  message
    .split('|')
    .map((form) =>
      [...new Set([...form.matchAll(/\{(\w+)\}/g)].map(([, name]) => name))].sort().join(),
    );
const english = flatten(en);
const vietnamese = flatten(vi);

describe('messages', () => {
  it('have the same keys in Vietnamese and English', () => {
    expect(Object.keys(english).sort()).toEqual(Object.keys(vietnamese).sort());
  });

  it('use the same placeholders in both locales', () => {
    const mismatched = Object.keys(vietnamese).filter(
      (key) =>
        new Set([...placeholderSets(vietnamese[key]!), ...placeholderSets(english[key] ?? '')])
          .size !== 1,
    );
    expect(mismatched).toEqual([]);
  });

  it('label every registered theme', () => {
    expect(THEMES.filter((theme) => !(theme.labelKey in vietnamese))).toEqual([]);
  });

  it('render singular and plural English forms from the count', () => {
    i18n.global.locale.value = 'en';
    expect(translate('problems.summary', { total: 1 }, 1)).toBe('1 problem');
    expect(translate('problems.summary', { total: 2 }, 2)).toBe('2 problems');
    expect(translate('ranking.cell.failed', { tries: 1 }, 1)).toBe('1 wrong try');
    expect(translate('ranking.cell.failed', { tries: 2 }, 2)).toBe('2 wrong tries');
    expect(translate('ranking.cell.pending', { tries: 1 }, 1)).toBe(
      '1 submission waiting to be revealed',
    );
    expect(translate('home.ratingChart', { count: 2, first: 'a', last: 'b' }, 2)).toBe(
      'Rating over 2 contests, from a to b',
    );
  });

  it('render every pluralised key in English for counts 1 and 2', () => {
    i18n.global.locale.value = 'en';
    const pluralKeys = Object.keys(english).filter((key) => english[key]!.includes('|'));
    expect(pluralKeys.length).toBeGreaterThan(0);
    for (const key of pluralKeys) {
      const names = placeholderSets(english[key]!)[0]!.split(',');
      const render = (count: number) =>
        translate(key, Object.fromEntries(names.map((name) => [name, count])), count);
      expect(render(1), key).not.toContain('|');
      expect(render(1), key).not.toEqual(render(2));
    }
  });
});
