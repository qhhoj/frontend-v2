import { describe, expect, it } from 'vitest';
import type { RankingContext } from '@/lib/ranking-cells';
import { loadedReplay, REPLAY_DURATION_SECONDS, REPLAY_PROBLEMS } from '@/test/replay-fixtures';
import { indexReplay } from './replay-board';
import { firstSolveMarks, recentEvents, timelineOf } from './replay-timeline';

const ICPC: RankingContext = {
  formatName: 'icpc',
  pointsPrecision: 0,
  locale: 'vi',
  showsTime: true,
};
const index = indexReplay(loadedReplay());
const timeline = timelineOf(index);

describe('replay timeline', () => {
  it('merges real and ghost events by time', () => {
    expect(timeline.map((entry) => [entry.event[0], entry.identity.name])).toEqual([
      [300, 'user_12'],
      [400, 'Ghost · HSG 2024 #1'],
      [540, 'user_07'],
      [720, 'user_12'],
      [1080, 'user_01'],
      [1860, 'user_07'],
      [1900, 'Ghost · HSG 2024 #1'],
      [2400, 'user_01'],
    ]);
  });

  it('lists the latest events at or before the clock, newest first, and none before the first', () => {
    expect(
      recentEvents(timeline, 1080, 3).map((entry) => [entry.event[0], entry.identity.name]),
    ).toEqual([
      [1080, 'user_01'],
      [720, 'user_12'],
      [540, 'user_07'],
    ]);
    expect(recentEvents(timeline, 299)).toEqual([]);
    expect(recentEvents(timeline, REPLAY_DURATION_SECONDS)).toHaveLength(5);
  });

  it('marks the first real solve of each problem on the track, ignoring the earlier ghost', () => {
    expect(firstSolveMarks(index, REPLAY_DURATION_SECONDS, ICPC)).toEqual([
      { problemId: REPLAY_PROBLEMS[0]!.problemId, label: 'A', seconds: 540, percent: 5 },
      {
        problemId: REPLAY_PROBLEMS[1]!.problemId,
        label: 'B',
        seconds: 1860,
        percent: expect.closeTo(17.22, 2),
      },
    ]);
  });
});
