import { afterEach, describe, expect, it, vi } from 'vitest';
import { contestDetail, participationSummary } from '@/test/fixtures';
import { mountComponent } from '@/test/mount';
import ContestCountdown from './ContestCountdown.vue';

const NOW = '2026-10-08T09:00:00Z';
/** A week-long contest where each participant gets a window. */
const contest = contestDetail({
  phase: 'running',
  startTime: '2026-10-08T08:00:00Z',
  endTime: '2026-10-14T09:00:00Z',
});
const timerUntil = (liveRun: ReturnType<typeof participationSummary> | null) =>
  mountComponent(ContestCountdown, { props: { contest, liveRun } })
    .get('time')
    .attributes('datetime');

describe('contest countdown for a live participant', () => {
  afterEach(() => vi.useRealTimers());

  it("counts to the participant's own window end when it closes before the contest", () => {
    vi.useFakeTimers({ now: Date.parse(NOW), toFake: ['Date'] });
    const run = participationSummary({ virtual: 0, endTime: '2026-10-08T11:00:00Z' });
    expect(timerUntil(run)).toBe('2026-10-08T11:00:00Z');
  });

  it('counts to the contest end when the run has no earlier end', () => {
    vi.useFakeTimers({ now: Date.parse(NOW), toFake: ['Date'] });
    const run = participationSummary({ virtual: 0, endTime: contest.endTime });
    expect(timerUntil(run)).toBe(contest.endTime);
  });
});
