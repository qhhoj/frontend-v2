import { Cpu, FileArchive, FileCode2, FileText } from 'lucide-vue-next';
import type { Component } from 'vue';

/**
 * Judge language key → icon. Every version and compiler of a language shares its family's icon; the name next to it
 * carries the version. A family has a mono logo (`src/assets/languages/<family>.svg`, sources and licences in `LICENSES.md`
 * there), a Lucide icon, or only a short glyph; an unknown key gets the generic file icon until it is mapped here.
 */
export type LanguageIconSize = 'sm' | 'md';
export type LanguageIcon =
  | { kind: 'logo'; url: string }
  | { kind: 'lucide'; icon: Component }
  | { kind: 'glyph'; text: string };

/** Where a visitor finds each logo's source and licence (the CC BY-SA marks ask for credit). */
export const LANGUAGE_LOGO_LICENCES_URL =
  'https://github.com/qhhoj/frontend-v2/blob/main/src/assets/languages/LICENSES.md';

/** URLs only, never inlined: the browser fetches a logo the first time one is on screen. */
const LOGO_FILES = import.meta.glob<string>('../../assets/languages/*.svg', {
  query: '?url&no-inline',
  import: 'default',
  eager: true,
});
const LOGO_URLS = new Map(
  Object.entries(LOGO_FILES).map(([path, url]) => [/([\w-]+)\.svg$/.exec(path)![1]!, url]),
);

const FAMILY_BY_KEY = new Map<string, string>(
  Object.entries({
    ADA: 'ada',
    AWK: 'awk',
    BF: 'bf',
    C: 'c',
    C11: 'c',
    CLANG: 'c',
    CLANGX: 'cpp',
    CBL: 'cobol',
    COFFEE: 'coffee',
    D: 'd',
    DART: 'dart',
    F95: 'fortran',
    FORTH: 'forth',
    GO: 'go',
    GROOVY: 'groovy',
    HASK: 'haskell',
    ICK: 'intercal',
    KOTLIN: 'kotlin',
    LUA: 'lua',
    MONOCS: 'csharp',
    MONOFS: 'fsharp',
    MONOVB: 'vb',
    OBJC: 'objc',
    OCAML: 'ocaml',
    OUTPUT: 'output',
    PAS: 'pascal',
    PERL: 'perl',
    PHP: 'php',
    PIKE: 'pike',
    PRO: 'prolog',
    RKT: 'racket',
    RUST: 'rust',
    SBCL: 'lisp',
    SCALA: 'scala',
    SCM: 'scheme',
    SCRATCH: 'scratch',
    SED: 'sed',
    SWIFT: 'swift',
    TCL: 'tcl',
    TEXT: 'text',
    TUR: 'turing',
    V8JS: 'js',
    ZIG: 'zig',
  }),
);
/** Version families: CPP03…CPP23, PY2/PY3/PYPY/PYPY3, JAVA/JAVA8, RUBY/RUBY18, GAS32/GAS64/GASARM/NASM/NASM64. */
const FAMILY_BY_PATTERN: [RegExp, string][] = [
  [/^CPP\d+$/, 'cpp'],
  [/^(?:PY|PYPY)\d*$/, 'python'],
  [/^JAVA\d*$/, 'java'],
  [/^RUBY\d*$/, 'ruby'],
  [/^(?:GAS|NASM)\w*$/, 'asm'],
];
const LUCIDE_BY_FAMILY = new Map<string, Component>([
  ['asm', Cpu],
  ['output', FileArchive],
  ['text', FileText],
]);
/** Families without a usable logo at 16 px: a short mono glyph in the 32 px tile, the generic icon inline. */
const GLYPH_BY_FAMILY = new Map<string, string>([
  ['ada', 'Ada'],
  ['awk', 'awk'],
  ['bf', 'bf'],
  ['cobol', 'CBL'],
  ['forth', 'Fth'],
  ['intercal', 'ICK'],
  ['objc', 'OC'],
  ['pascal', 'Pas'],
  ['pike', 'Pk'],
  ['scheme', 'Scm'],
  ['sed', 'sed'],
  ['tcl', 'Tcl'],
  ['turing', 'T'],
]);

/** The family a judge key belongs to (`CPP23` → `cpp`), or `null` when the key is not mapped yet. */
export function languageFamily(key: string): string | null {
  const upper = key.toUpperCase();
  return (
    FAMILY_BY_KEY.get(upper) ??
    FAMILY_BY_PATTERN.find(([pattern]) => pattern.test(upper))?.[1] ??
    null
  );
}

/**
 * What to draw for `key` at `size`; no key draws the generic icon. `undefined` is accepted because an older
 * backend omits the field, and an icon must never break the page it sits on.
 */
export function languageIconOf(
  key: string | null | undefined,
  size: LanguageIconSize,
): LanguageIcon {
  const family = key == null ? null : languageFamily(key);
  const url = family && LOGO_URLS.get(family);
  if (url) return { kind: 'logo', url };
  const icon = family && LUCIDE_BY_FAMILY.get(family);
  if (icon) return { kind: 'lucide', icon };
  const glyph = family && GLYPH_BY_FAMILY.get(family);
  if (glyph && size === 'md') return { kind: 'glyph', text: glyph };
  return { kind: 'lucide', icon: FileCode2 };
}
