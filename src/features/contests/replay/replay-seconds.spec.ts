import { describe, expect, it } from 'vitest';
import { endedContest } from '@/test/replay-fixtures';
import { parseReplaySeconds, replayDurationSeconds } from './replay-seconds';

describe('replayDurationSeconds', () => {
  it('uses the contest length, the window when one is set, and never ends before the last event', () => {
    expect(replayDurationSeconds(endedContest())).toBe(10_800);
    expect(replayDurationSeconds(endedContest({ timeLimit: 5400 }))).toBe(5400);
    expect(replayDurationSeconds(endedContest({ timeLimit: 5400 }), 6000)).toBe(6000);
  });
});

describe('parseReplaySeconds', () => {
  it.each([
    ['5184', 5184],
    ['12.7', 12],
    ['0', 0],
    ['abc', 0],
    ['-5', 0],
    ['', 0],
    ['Infinity', 0],
    ['1e9', 10_800],
    [undefined, 0],
    [null, 0],
    [['30', '40'], 30],
  ] as const)('reads ?t=%j as %i inside a 3-hour replay', (raw, expected) => {
    expect(parseReplaySeconds(raw, 10_800)).toBe(expected);
  });
});
