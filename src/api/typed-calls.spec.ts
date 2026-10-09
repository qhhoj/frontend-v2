import { describe, expect, it } from 'vitest';

const sources = import.meta.glob<string>('/src/**/*.{ts,vue}', {
  query: '?raw',
  import: 'default',
  eager: true,
});
/** The two files allowed to import the untyped request functions: the client itself and its typed wrapper. */
const ALLOWED = ['/src/api/client.ts', '/src/api/typed.ts'];
/** Any mention of the names: a named, namespace, re-exported or dynamic import all have to spell one to use it. */
const UNTYPED_NAME = /\bapi(?:Request|Page)\b/;

describe('typed API calls', () => {
  it('mentions apiRequest or apiPage only in client.ts and typed.ts (specs excluded)', () => {
    const offenders = Object.entries(sources)
      .filter(([file]) => !file.endsWith('.spec.ts') && !ALLOWED.includes(file))
      .filter(([, source]) => UNTYPED_NAME.test(source))
      .map(([file]) => file);
    expect(offenders).toEqual([]);
  });
});
