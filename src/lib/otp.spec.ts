import { describe, expect, it } from 'vitest';
import { digitsOf, enterDigits, eraseDigit, normalizeBackupCode } from './otp';

describe('digitsOf', () => {
  it.each([
    ['481923', '481923'],
    ['481 923', '481923'],
    ['481-923', '481923'],
    [' code: 4 8 1 9 2 3\n', '481923'],
    ['abc', ''],
  ])('keeps the digits of %j', (text, digits) => {
    expect(digitsOf(text)).toBe(digits);
  });
});

describe('enterDigits', () => {
  it('types a digit into the next box and moves on', () => {
    expect(enterDigits('', 0, '4')).toEqual({ code: '4', focus: 1 });
    expect(enterDigits('4', 1, '8')).toEqual({ code: '48', focus: 2 });
  });

  it('overwrites the box that is typed into and keeps the rest', () => {
    expect(enterDigits('48', 0, '7')).toEqual({ code: '78', focus: 1 });
  });

  it('fills the whole code from a full paste, wherever it lands', () => {
    expect(enterDigits('', 0, '481 923')).toEqual({ code: '481923', focus: 5 });
    expect(enterDigits('12', 4, '481-923')).toEqual({ code: '481923', focus: 5 });
    expect(enterDigits('', 0, '48192399')).toEqual({ code: '481923', focus: 5 });
  });

  it('puts a partial paste at the focused box and never leaves a gap', () => {
    expect(enterDigits('48', 2, '17')).toEqual({ code: '4817', focus: 4 });
    expect(enterDigits('48', 5, '1')).toEqual({ code: '481', focus: 3 });
    expect(enterDigits('12345', 5, '67')).toEqual({ code: '123456', focus: 5 });
  });

  it('ignores input without digits', () => {
    expect(enterDigits('48', 2, 'ab')).toBeNull();
    expect(enterDigits('48', 2, '')).toBeNull();
  });
});

describe('eraseDigit', () => {
  it('clears the box with a digit and shifts the rest left', () => {
    expect(eraseDigit('481', 1)).toEqual({ code: '41', focus: 1 });
    expect(eraseDigit('481', 0)).toEqual({ code: '81', focus: 0 });
  });

  it('clears the previous digit from an empty box', () => {
    expect(eraseDigit('48', 2)).toEqual({ code: '4', focus: 1 });
  });

  it('does nothing at the start of an empty code', () => {
    expect(eraseDigit('', 0)).toEqual({ code: '', focus: 0 });
  });
});

describe('normalizeBackupCode', () => {
  it('drops spaces and dashes and upper-cases (the backend upper-cases but keeps dashes)', () => {
    expect(normalizeBackupCode('abcd-efgh ijkl 2345')).toBe('ABCDEFGHIJKL2345');
  });
});
