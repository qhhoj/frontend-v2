/** Maps submission language keys and Markdown fence names to the legacy ace modes `loadLanguagePack` knows. Unknown is `null` (plain text). */
const C_CPP = 'c_cpp';
const FENCE_NAMES: Record<string, string> = {
  c: C_CPP,
  h: C_CPP,
  cpp: C_CPP,
  'c++': C_CPP,
  cc: C_CPP,
  cxx: C_CPP,
  hpp: C_CPP,
  python: 'python',
  py: 'python',
  python3: 'python',
  java: 'java',
  kotlin: 'java',
  kt: 'java',
  javascript: 'javascript',
  js: 'javascript',
  jsx: 'javascript',
  typescript: 'javascript',
  ts: 'javascript',
  rust: 'rust',
  rs: 'rust',
  go: 'golang',
  golang: 'golang',
};
const SUBMISSION_KEYS: Record<string, string> = {
  C: C_CPP,
  CLANG: C_CPP,
  CLANGX: C_CPP,
  PY2: 'python',
  PY3: 'python',
  PYPY: 'python',
  PYPY2: 'python',
  PYPY3: 'python',
  JAVA: 'java',
  JAVA8: 'java',
  JAVA11: 'java',
  KOTLIN: 'java',
  GO: 'golang',
  RUST: 'rust',
};
const CPP_KEY = /^(?:C\d\d|CPP\d\d)$/;

export function aceForSubmissionKey(key: string): string | null {
  const upper = key.toUpperCase();
  if (CPP_KEY.test(upper)) return C_CPP;
  return Object.hasOwn(SUBMISSION_KEYS, upper) ? SUBMISSION_KEYS[upper]! : null;
}

export function aceForFenceName(name: string): string | null {
  const lower = name.toLowerCase();
  return Object.hasOwn(FENCE_NAMES, lower) ? FENCE_NAMES[lower]! : null;
}
