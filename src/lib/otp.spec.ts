import { describe, expect, it } from 'vitest';
import { digitsOf, enterDigits, eraseDigit } from './otp';

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
});

describe('eraseDigit', () => {
  it('clears the box with a digit and shifts the rest left', () => {
    expect(eraseDigit('481', 1)).toEqual({ code: '41', focus: 1 });
    expect(eraseDigit('481', 0)).toEqual({ code: '81', focus: 0 });
  });
});
