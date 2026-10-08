import { expect, it, vi } from 'vitest';
import { loadLanguagePack } from './code-languages';

it('returns an extension for a supported language and null for the rest', async () => {
  expect(await loadLanguagePack('c_cpp')).toBeTruthy();
  expect(await loadLanguagePack('pascal')).toBeNull();
  expect(await loadLanguagePack('text')).toBeNull();
  expect(await loadLanguagePack('constructor')).toBeNull(); // not a table lookup that walks the prototype
  expect(await loadLanguagePack('')).toBeNull();
});

it('returns null and warns when the pack chunk fails to load', async () => {
  vi.resetModules();
  vi.doMock('@codemirror/lang-rust', () => {
    throw new Error('chunk failed');
  });
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  const { loadLanguagePack: loadWithBrokenRust } = await import('./code-languages');
  expect(await loadWithBrokenRust('rust')).toBeNull();
  expect(warn).toHaveBeenCalledExactlyOnceWith(
    'code language pack failed to load',
    'rust',
    expect.any(Error),
  );
  vi.doUnmock('@codemirror/lang-rust');
});
