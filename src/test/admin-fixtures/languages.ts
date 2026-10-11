import type { LanguageAdmin } from '../../api/types/languages-admin';

export const languageAdmin = (overrides: Partial<LanguageAdmin> = {}): LanguageAdmin => ({
  id: '0192a000-0000-7000-8000-00000000b101',
  key: 'CPP20',
  name: 'C++20',
  shortName: 'C++20',
  commonName: 'C++',
  ace: 'c_cpp',
  pygments: 'cpp',
  template: '',
  info: '',
  isActive: true,
  order: 0,
  description: 'g++ -std=c++20',
  extension: 'cpp',
  fileOnly: false,
  fileSizeLimit: 0,
  includeInProblem: true,
  ...overrides,
});

/** Keys match the runtimes of `JUDGE_FLEET`; RUBY is run by no judge. */
export const LANGUAGES: LanguageAdmin[] = [
  languageAdmin(),
  languageAdmin({
    id: '0192a000-0000-7000-8000-00000000b102',
    key: 'CPP17',
    name: 'C++17',
    shortName: 'C++17',
  }),
  languageAdmin({
    id: '0192a000-0000-7000-8000-00000000b103',
    key: 'PY3',
    name: 'Python 3',
    shortName: null,
    commonName: 'Python',
    ace: 'python',
    pygments: 'python3',
    extension: 'py',
  }),
  languageAdmin({
    id: '0192a000-0000-7000-8000-00000000b104',
    key: 'PAS',
    name: 'Pascal',
    shortName: null,
    commonName: 'Pascal',
    ace: 'pascal',
    pygments: 'pascal',
    extension: 'pas',
  }),
  languageAdmin({
    id: '0192a000-0000-7000-8000-00000000b105',
    key: 'RUBY',
    name: 'Ruby',
    shortName: null,
    commonName: 'Ruby',
    ace: 'ruby',
    pygments: 'ruby',
    extension: 'rb',
    includeInProblem: false,
  }),
];
