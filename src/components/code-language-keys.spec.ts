import { describe, expect, it } from 'vitest';
import { aceForFenceName, aceForSubmissionKey } from './code-language-keys';

describe('language keys', () => {
  it.each([
    ['C', 'c_cpp'],
    ['C11', 'c_cpp'],
    ['CPP03', 'c_cpp'],
    ['CPP23', 'c_cpp'],
    ['CLANGX', 'c_cpp'],
    ['PY3', 'python'],
    ['PYPY3', 'python'],
    ['JAVA8', 'java'],
    ['KOTLIN', 'java'],
    ['PAS', null],
    ['TEXT', null],
    ['constructor', null],
  ])('submission key %s is %s', (key, ace) => expect(aceForSubmissionKey(key)).toBe(ace));

  it.each([
    ['cpp', 'c_cpp'],
    ['c++', 'c_cpp'],
    ['py', 'python'],
    ['js', 'javascript'],
    ['rs', 'rust'],
    ['go', 'golang'],
    ['toString', null],
    ['', null],
  ])('fence %s is %s', (name, ace) => expect(aceForFenceName(name)).toBe(ace));
});
