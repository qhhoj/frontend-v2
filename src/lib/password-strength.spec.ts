import { describe, expect, it } from 'vitest';
import { estimatePasswordStrength } from './password-strength';

describe('estimatePasswordStrength', () => {
  it('is 0 for nothing and at most 1 for what the backend rejects', () => {
    expect(estimatePasswordStrength('')).toBe(0);
    expect(estimatePasswordStrength('Ab1!xyz')).toBe(1); // 7 characters
    expect(estimatePasswordStrength('123456789012')).toBe(1); // all digits
    expect(estimatePasswordStrength('Password1')).toBe(1); // common, any case (rated 2 without the list)
    expect(estimatePasswordStrength('aaaaaaaaaaaaaaaa')).toBe(1); // one character repeated
  });

  it('treats a password containing the username or the email name as weak', () => {
    const secret = 'user_01 loves tea 2026';
    expect(estimatePasswordStrength(secret)).toBeGreaterThan(1);
    expect(estimatePasswordStrength(secret, { username: 'USER_01' })).toBe(1);
    expect(estimatePasswordStrength(secret, { email: 'user_01@example.com' })).toBe(1);
  });

  it('ignores identities shorter than 3 characters, like the backend', () => {
    expect(estimatePasswordStrength('ab long enough phrase', { username: 'ab' })).toBeGreaterThan(
      1,
    );
  });

  it('rates variety and length', () => {
    expect(estimatePasswordStrength('Abcdef1!')).toBe(2);
    expect(estimatePasswordStrength('Tr0ub4dor&3')).toBe(3);
    expect(estimatePasswordStrength('correct horse battery staple')).toBe(4);
  });

  it('never lowers the score when words are appended to a password that is not rejected', () => {
    const base = 'Tr0ub4dor&3';
    expect(estimatePasswordStrength(`${base} horse battery`)).toBeGreaterThanOrEqual(
      estimatePasswordStrength(base),
    );
  });
});
