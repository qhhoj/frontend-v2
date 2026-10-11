import { describe, expect, it } from 'vitest';
import { deletedProblem } from '@/test/f4-fixtures';
import { graceTextOf } from './days-left';

describe('graceTextOf', () => {
  it('counts the days left while the problem can be restored', () => {
    expect(graceTextOf(deletedProblem({ daysLeft: 26 }))).toEqual({
      key: 'admin.lifecycle.grace.left',
      count: 26,
    });
  });

  it('says the purge is due once no day is left, and purged once it ran', () => {
    expect(graceTextOf(deletedProblem({ daysLeft: 0 })).key).toBe('admin.lifecycle.grace.due');
    expect(graceTextOf(deletedProblem({ daysLeft: 3, isPurged: true })).key).toBe(
      'admin.lifecycle.grace.purged',
    );
  });
});
