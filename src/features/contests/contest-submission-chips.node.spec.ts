import { describe, expect, it } from 'vitest';
import type { SubmissionFilters } from '@/features/submissions/use-submission-filters';
import { contestChipPatch, isContestChipOn } from './contest-submission-chips';

const filters = (overrides: Partial<SubmissionFilters> = {}): SubmissionFilters => ({
  problem: '',
  user: '',
  results: [],
  languageIds: [],
  statusGroups: [],
  page: 1,
  live: true,
  ...overrides,
});
const ALL = { kind: 'all' } as const;
const GRADING = { kind: 'grading' } as const;
const problemB = { kind: 'problem', code: 'e2e_max' } as const;

describe('contest submission chips', () => {
  it('lights "Tất cả" only when neither a problem nor grading is picked', () => {
    expect(isContestChipOn(filters(), ALL)).toBe(true);
    expect(isContestChipOn(filters({ problem: 'e2e_max' }), ALL)).toBe(false);
    expect(isContestChipOn(filters({ statusGroups: ['grading'] }), ALL)).toBe(false);
    expect(isContestChipOn(filters({ statusGroups: ['final'] }), ALL)).toBe(true);
    expect(isContestChipOn(filters({ results: ['AC'] }), ALL)).toBe(false);
    expect(isContestChipOn(filters({ languageIds: ['py3'] }), ALL)).toBe(false);
  });

  it('picks a problem by its letter, and a second click shows every problem again', () => {
    expect(contestChipPatch(filters(), problemB)).toEqual({ problem: 'e2e_max' });
    expect(contestChipPatch(filters({ problem: 'e2e_max' }), problemB)).toEqual({ problem: '' });
    expect(isContestChipOn(filters({ problem: 'e2e_max' }), problemB)).toBe(true);
  });

  it('toggles grading and keeps the final-judging box', () => {
    expect(contestChipPatch(filters({ statusGroups: ['final'] }), GRADING)).toEqual({
      statusGroups: ['final', 'grading'],
    });
    expect(contestChipPatch(filters({ statusGroups: ['grading'] }), GRADING)).toEqual({
      statusGroups: [],
    });
  });

  it('clears what narrows the list on "Tất cả", keeping the final-judging box', () => {
    expect(
      contestChipPatch(
        filters({
          problem: 'e2e_max',
          results: ['WA'],
          languageIds: ['py3'],
          statusGroups: ['grading', 'final'],
        }),
        ALL,
      ),
    ).toEqual({ problem: '', results: [], languageIds: [], statusGroups: ['final'] });
  });
});
