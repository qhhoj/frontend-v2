import { describe, expect, it } from 'vitest';
import { findHandWrittenTypes } from './handwritten-types';

const typeFiles = import.meta.glob<string>('./*.ts', {
  query: '?raw',
  import: 'default',
  eager: true,
});
const names = (source: string) => findHandWrittenTypes(source).map((found) => found.name);

describe('findHandWrittenTypes', () => {
  it('accepts aliases of the generated schema, nullable ones, Pick and indexed access', () => {
    expect(
      names(`
        export type A = Schemas['X'];
        export type B = Schemas['X'] | null;
        export type C = Pick<Schemas['X'], 'a' | 'b'>;
        export type D = NonNullable<Schemas['X']['y']>[number];
        export type E = QueryOf<'/problems'>;
      `),
    ).toEqual([]);
  });

  it('refuses an interface, an object type, an enum and a literal union', () => {
    expect(names('export interface A { a: string }')).toEqual(['A']);
    expect(names('export type B = { a: string };')).toEqual(['B']);
    expect(names('export enum Level { Low }')).toEqual(['Level']);
    expect(names("export type StatementLanguage = 'vi' | 'en';")).toEqual(['StatementLanguage']);
  });

  it('refuses an object shape hidden inside a generic or a template literal type', () => {
    expect(names('export type A = Array<{ a: string }>;')).toEqual(['A']);
    expect(names('export type S = `-${string}`;')).toEqual(['S']);
  });

  it('allows a shape tagged @uiOnly with a reason, and only with a reason', () => {
    expect(
      names('/** @uiOnly the filter form keeps its draft */\nexport interface F { a: string }'),
    ).toEqual([]);
    expect(names('/** @uiOnly */\nexport interface F { a: string }')).toEqual(['F']);
  });

  it('leaves constants alone and reports the line of the offence', () => {
    expect(names("export const PAGE_SIZE = 20;\nexport const LIST = ['a'] as const;")).toEqual([]);
    expect(
      findHandWrittenTypes('export const A = 1;\n\nexport interface B { a: string }')[0]!.line,
    ).toBe(3);
  });
});

describe('src/api/types', () => {
  it('holds only aliases of the generated schema, plus reasoned @uiOnly shapes', () => {
    const offences = Object.entries(typeFiles)
      .filter(([file]) => !file.endsWith('.spec.ts') && !file.endsWith('/handwritten-types.ts'))
      .flatMap(([file, source]) =>
        findHandWrittenTypes(source).map(
          (found) => `${file}:${found.line} ${found.name}: ${found.reason}`,
        ),
      );
    expect(offences).toEqual([]);
  });
});
