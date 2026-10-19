import { describe, expect, it } from 'vitest';
// @ts-expect-error plain .mjs module without types
import { classLiterals, classTokens, utilityOf } from './class-tokens.mjs';

describe('classTokens', () => {
  it('splits every quoted string of the line into words, as written', () => {
    expect(classTokens(`const a = 'p-2 md:text-lg'; const b = "!rounded-lg -mt-1";`)).toEqual([
      'p-2',
      'md:text-lg',
      '!rounded-lg',
      '-mt-1',
    ]);
  });

  it('reads a template literal and ignores the text outside quotes', () => {
    expect(classTokens('<p class="a  b">text c</p> `d ${x}`')).toEqual(['a', 'b', 'd', '${x}']);
  });

  it('reads the strings nested in a Vue expression as words of their own', () => {
    expect(classTokens(`:class="error ? 'border-negative' : 'border-line'"`)).toEqual([
      'error',
      '?',
      'border-negative',
      ':',
      'border-line',
    ]);
  });

  it('groups the words by quoted string', () => {
    expect(classLiterals(`const a = 'p-2 m-1'; const b = "z-10";`)).toEqual([
      ['p-2', 'm-1'],
      ['z-10'],
    ]);
  });

  it.each([`// 'p-2'`, ` * "p-2" in a doc comment`, `/* 'p-2' */`])(
    'gives nothing for %s',
    (line) => {
      expect(classTokens(line)).toEqual([]);
    },
  );
});

describe('utilityOf', () => {
  it.each([
    ['text-lg', 'text-lg'],
    ['md:hover:text-lg', 'text-lg'],
    ['has-[:checked]:border-accent', 'border-accent'],
    ['!rounded-lg', 'rounded-lg'],
    ['-mt-1', 'mt-1'],
    ['z-[5]!', 'z-[5]'],
  ])('%s is the utility %s', (token, utility) => {
    expect(utilityOf(token)).toBe(utility);
  });
});
