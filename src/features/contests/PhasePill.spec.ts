import { describe, expect, it } from 'vitest';
import type { ContestPhase } from '@/api/types/contests';
import { mountComponent } from '@/test/mount';
import PhasePill from './PhasePill.vue';

const LABELS: Record<ContestPhase, string> = {
  running: 'Đang diễn ra',
  upcoming: 'Sắp diễn ra',
  ended: 'Đã kết thúc',
};
const LIVE_DOT = 'span[aria-hidden="true"]';

const pillFor = (phase: ContestPhase) => mountComponent(PhasePill, { props: { phase } });

describe('phase pill', () => {
  it.each(Object.keys(LABELS) as ContestPhase[])('names the %s phase', (phase) => {
    expect(pillFor(phase).text()).toBe(LABELS[phase]);
  });

  it('draws a live dot only while the contest is running', () => {
    expect(pillFor('running').find(LIVE_DOT).exists()).toBe(true);
    expect(pillFor('upcoming').find(LIVE_DOT).exists()).toBe(false);
    expect(pillFor('ended').find(LIVE_DOT).exists()).toBe(false);
  });

  it('takes the tone of its phase', () => {
    expect(pillFor('running').classes()).toEqual(
      expect.arrayContaining(['bg-verdict-ac-bg', 'text-verdict-ac']),
    );
    expect(pillFor('upcoming').classes()).toEqual(
      expect.arrayContaining(['bg-accent-soft', 'text-accent-soft-text']),
    );
    expect(pillFor('ended').classes()).toEqual(
      expect.arrayContaining(['bg-verdict-pending-bg', 'text-verdict-pending']),
    );
  });
});
