import { describe, expect, it } from 'vitest';
// @ts-expect-error plain .mjs module without types
import { retiredUtilities } from './retired-utilities.mjs';

const found = (line: string): string[] => retiredUtilities(line);

describe('retiredUtilities', () => {
  it.each([
    [`class="rounded-panel p-4"`, ['rounded-panel']],
    [`'flex rounded-tile border'`, ['rounded-tile']],
    [`'md:rounded-panel'`, ['rounded-panel']],
    [`'rounded-t-tile rounded-b-panel'`, ['rounded-t-tile', 'rounded-b-panel']],
    [`:class="wide ? 'rounded-panel' : 'rounded-card'"`, ['rounded-panel']],
  ])('flags %s', (line, expected) => {
    expect(found(line)).toEqual(expected);
  });

  it.each([
    `class="rounded-cell rounded-row rounded-card rounded-pill rounded-control rounded-skeleton"`,
    `class="rounded-t-card rounded-full"`,
    `class="panel tile rounded-panelled"`,
    `// rounded-panel was retired`,
    ` * 'rounded-tile' in a doc comment`,
  ])('accepts %s', (line) => {
    expect(found(line)).toEqual([]);
  });
});
