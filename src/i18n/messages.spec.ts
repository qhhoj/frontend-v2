import { describe, expect, it } from 'vitest';
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
const placeholders = (message: string) =>
  [...message.matchAll(/\{(\w+)\}/g)].map(([, name]) => name).sort();
const english = flatten(en);
const vietnamese = flatten(vi);

describe('messages', () => {
  it('have the same keys in Vietnamese and English', () => {
    expect(Object.keys(english).sort()).toEqual(Object.keys(vietnamese).sort());
  });

  it('use the same placeholders in both locales', () => {
    const mismatched = Object.keys(vietnamese).filter(
      (key) => placeholders(vietnamese[key]!).join() !== placeholders(english[key] ?? '').join(),
    );
    expect(mismatched).toEqual([]);
  });

  it('label every registered theme', () => {
    expect(THEMES.filter((theme) => !(theme.labelKey in vietnamese))).toEqual([]);
  });
});
