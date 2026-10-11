import { describe, expect, it } from 'vitest';
import { usernameProblem } from './username';

describe('usernameProblem', () => {
  it.each(['user_01', 'A', 'a_b_c', 'x'.repeat(30)])('accepts %s', (name) => {
    expect(usernameProblem(name)).toBeNull();
  });

  it.each(['bad name', 'a-b', 'user@x', 'tên', 'a.b', ' lead'])(
    'rejects the format of %j',
    (name) => {
      expect(usernameProblem(name)).toBe('format');
    },
  );
});
