import { Cpu, FileCode2, FileText } from 'lucide-vue-next';
import { describe, expect, it } from 'vitest';
import licences from '@/assets/languages/LICENSES.md?raw';
import { LIVE_LANGUAGES } from '@/test/live-languages';
import { languageFamily, languageIconOf } from './language-icons';

const VENDORED = Object.keys(import.meta.glob('../../assets/languages/*.svg')).map(
  (path) => /([\w-]+)\.svg$/.exec(path)![1]!,
);
/** Keys whose language has no logo here: assembly, plain text, output-only and the glyph-only families. */
const LOGO_LESS = [
  'ADA',
  'AWK',
  'BF',
  'CBL',
  'FORTH',
  'GAS32',
  'GAS64',
  'GASARM',
  'ICK',
  'NASM',
  'NASM64',
  'OBJC',
  'OUTPUT',
  'PAS',
  'PIKE',
  'SCM',
  'SED',
  'TCL',
  'TEXT',
  'TUR',
];
const urlOf = (key: string) => {
  const icon = languageIconOf(key, 'sm');
  return icon.kind === 'logo' ? icon.url : null;
};

describe('language icons', () => {
  it.each(LIVE_LANGUAGES)('live key $key ($name) belongs to a family', ({ key }) => {
    expect(languageFamily(key)).not.toBeNull();
  });

  it('draws a logo for every live key except the logo-less ones', () => {
    const logoLess = LIVE_LANGUAGES.filter(({ key }) => urlOf(key) === null).map(({ key }) => key);
    expect(logoLess.sort()).toEqual(LOGO_LESS);
  });

  it('uses every vendored logo for some live key', () => {
    const used = new Set(LIVE_LANGUAGES.map(({ key }) => languageFamily(key)));
    expect(VENDORED.filter((family) => !used.has(family))).toEqual([]);
  });

  it('credits every vendored logo in LICENSES.md', () => {
    expect(VENDORED.filter((family) => !licences.includes(`\`${family}.svg\``))).toEqual([]);
  });

  it.each([
    ['CPP23', 'CPP03'],
    ['CLANGX', 'CPP17'],
    ['CLANG', 'C11'],
    ['PYPY3', 'PY2'],
    ['JAVA8', 'JAVA'],
    ['RUBY18', 'RUBY'],
  ])('version %s shares the icon of %s', (variant, base) => {
    expect(urlOf(variant)).not.toBeNull();
    expect(urlOf(variant)).toBe(urlOf(base));
  });

  it('keeps C apart from C++ and C#', () => {
    expect(new Set([urlOf('C'), urlOf('CPP17'), urlOf('MONOCS')]).size).toBe(3);
  });

  it('reads keys case-insensitively', () => {
    expect(languageFamily('cpp17')).toBe('cpp');
  });

  it.each([['GAS64'], ['NASM'], ['GASARM']])('draws assembly %s as a chip', (key) => {
    expect(languageIconOf(key, 'sm')).toEqual({ kind: 'lucide', icon: Cpu });
  });

  it('draws plain text as a document', () => {
    expect(languageIconOf('TEXT', 'md')).toEqual({ kind: 'lucide', icon: FileText });
  });

  it('shows a glyph-only language as its glyph in the tile and the generic icon inline', () => {
    expect(languageIconOf('PAS', 'md')).toEqual({ kind: 'glyph', text: 'Pas' });
    expect(languageIconOf('PAS', 'sm')).toEqual({ kind: 'lucide', icon: FileCode2 });
  });

  it.each([['NEWLANG'], ['constructor'], ['toString'], ['']])(
    'falls back to the generic icon for the unmapped key %j',
    (key) => {
      expect(languageFamily(key)).toBeNull();
      expect(languageIconOf(key, 'md')).toEqual({ kind: 'lucide', icon: FileCode2 });
    },
  );

  it('falls back to the generic icon when the caller has no key', () => {
    expect(languageIconOf(null, 'sm')).toEqual({ kind: 'lucide', icon: FileCode2 });
  });
});
