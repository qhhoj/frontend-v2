import { describe, expect, it } from 'vitest';
import { usernameProblem } from './username';

describe('usernameProblem', () => {
  it.each(['user_01', 'A', 'a_b_c', 'x'.repeat(30)])('accepts %s', (name) => {
    expect(usernameProblem(name)).toBeNull();
  });

  it('does not complain about an empty field (required covers it)', () => {
    expect(usernameProblem('')).toBeNull();
  });

  it.each(['bad name', 'a-b', 'user@x', 'tên', 'a.b', ' lead'])(
    'rejects the format of %j',
    (name) => {
      expect(usernameProblem(name)).toBe('format');
    },
  );

  it('rejects more than 30 characters', () => {
    expect(usernameProblem('x'.repeat(31))).toBe('length');
  });
});
