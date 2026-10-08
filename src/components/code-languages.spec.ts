import { expect, it } from 'vitest';
import { loadLanguagePack } from './code-languages';

it('returns an extension for a supported language and null for the rest', async () => {
  expect(await loadLanguagePack('c_cpp')).toBeTruthy();
  expect(await loadLanguagePack('pascal')).toBeNull();
  expect(await loadLanguagePack('text')).toBeNull();
  expect(await loadLanguagePack('constructor')).toBeNull(); // not a table lookup that walks the prototype
  expect(await loadLanguagePack('')).toBeNull();
});
