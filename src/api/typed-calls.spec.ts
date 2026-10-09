import { describe, expect, it } from 'vitest';

const sources = import.meta.glob<string>('/src/**/*.{ts,vue}', {
  query: '?raw',
  import: 'default',
  eager: true,
});
/** The two files allowed to import the untyped request functions: the client itself and its typed wrapper. */
const ALLOWED = ['/src/api/client.ts', '/src/api/typed.ts'];
const UNTYPED_IMPORT = /import\s*(?:type\s*)?\{[^}]*\bapi(?:Request|Page)\b[^}]*\}\s*from/;

describe('typed API calls', () => {
  it('imports apiRequest or apiPage only in client.ts and typed.ts (specs excluded)', () => {
    const offenders = Object.entries(sources)
      .filter(([file]) => !file.endsWith('.spec.ts') && !ALLOWED.includes(file))
      .filter(([, source]) => UNTYPED_IMPORT.test(source))
      .map(([file]) => file);
    expect(offenders).toEqual([]);
  });
});
