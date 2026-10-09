import { describe, expect, it } from 'vitest';
import { contestProblem, viewerResult } from '@/test/fixtures';
import { switcherEntries } from './problem-switcher';

const problems = [
  contestProblem(0, { viewerResult: viewerResult({ isSolved: true, attempts: 1 }) }),
  contestProblem(1, { viewerResult: viewerResult({ attempts: 2 }) }),
  contestProblem(2, { viewerResult: viewerResult() }),
];

describe('problem switcher entries', () => {
  it('lists the contest problems in contest order and marks exactly the current one', () => {
    const entries = switcherEntries(problems, 'r42b')!;
    expect(entries.map((entry) => entry.label)).toEqual(['A', 'B', 'C']);
    expect(entries.filter((entry) => entry.isCurrent).map((entry) => entry.code)).toEqual(['r42b']);
  });

  it('names each status from the viewer result', () => {
    expect(switcherEntries(problems, 'r42a')!.map((entry) => entry.status)).toEqual([
      'solved',
      'tried',
      'untried',
    ]);
    const hidden = [contestProblem(0, { viewerResult: null })];
    expect(switcherEntries(hidden, 'r42a')![0]!.status).toBe('unknown');
  });

  it('is absent when the contest does not list the problem or lists nothing', () => {
    expect(switcherEntries(problems, 'other')).toBeNull();
    expect(switcherEntries(null, 'r42a')).toBeNull();
  });
});
