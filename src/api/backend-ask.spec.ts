import { describe, expect, it } from 'vitest';
import { askIdsIn, trustedUntilBackendFixed } from './backend-ask';

const sources = import.meta.glob<string>('/src/**/*.{ts,vue}', {
  query: '?raw',
  import: 'default',
  eager: true,
});
const register = import.meta.glob<string>('/docs/api-mismatches/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
});

describe('trustedUntilBackendFixed', () => {
  it('hands the value back typed as wanted', () => {
    const value = { id: 'x' };
    expect(trustedUntilBackendFixed<{ id: string }>('M2-01', value)).toBe(value);
  });
  it('refuses an id that is not a lane-numbered ask', () => {
    expect(() => trustedUntilBackendFixed('later' as never, 1)).toThrow('M<lane>-<nn>');
  });
});

describe('askIdsIn', () => {
  it('finds each ask id a source file passes as the first argument, with nested generics too', () => {
    const source = `
      const a = trustedUntilBackendFixed<Row>('M2-01', row);
      const b = trustedUntilBackendFixed(
        'M5-12',
        other,
      );
      const c = trustedUntilBackendFixed<Array<Row>>('M3-04', rows);
      const d = somethingElse('M9-99');
      const e = trustedUntilBackendFixed(value, 'M1-01');
    `;
    expect(askIdsIn(source)).toEqual(['M2-01', 'M5-12', 'M3-04']);
  });
});

describe('the ask register', () => {
  it('has a section in docs/api-mismatches for every ask id used in src', () => {
    const used = Object.entries(sources)
      .filter(([file]) => !file.endsWith('.spec.ts') && !file.endsWith('/api/backend-ask.ts'))
      .flatMap(([, source]) => askIdsIn(source));
    const registered = Object.values(register).join('\n');
    const missing = used.filter((id) => !new RegExp(`^## ${id}\\b`, 'm').test(registered));
    expect(missing).toEqual([]);
  });
});
