import { describe, expect, it } from 'vitest';
import type { RankingContext } from '@/lib/ranking-cells';
import { mountComponent } from '@/test/mount';
import { loadedReplay, REPLAY_PROBLEMS } from '@/test/replay-fixtures';
import ReplayEventFeed from './ReplayEventFeed.vue';
import { indexReplay } from './replay-board';
import { recentEvents, timelineOf } from './replay-timeline';

const ICPC: RankingContext = {
  formatName: 'icpc',
  pointsPrecision: 0,
  locale: 'vi',
  showsTime: true,
};
const timeline = timelineOf(indexReplay(loadedReplay()));
const feed = (seconds: number) =>
  mountComponent(ReplayEventFeed, {
    props: { entries: recentEvents(timeline, seconds), problems: REPLAY_PROBLEMS, context: ICPC },
  });

describe('ReplayEventFeed', () => {
  it('lists the latest events newest first with their clock, name and outcome, ghosts marked', () => {
    const items = feed(540).findAll('li');
    // Vue condenses the newline between sibling elements, so the clock and the outcome are read from their own spans.
    const lines = items.map((item) => {
      const [clock, outcome] = item.findAll('span');
      return [clock!.text(), outcome!.text().replace(/\s+/g, ' ')];
    });
    expect(lines).toEqual([
      ['00:09:00', 'user_07 giải A'],
      ['00:06:40', 'Ghost · HSG 2024 #1 giải A'],
      ['00:05:00', 'user_12 sai A (-1)'],
    ]);
    expect(items[1]!.find('svg').exists()).toBe(true);
    expect(items[0]!.find('svg').exists()).toBe(false);
  });

  it('says "Ghost" once for a ghost whose label already says it, and adds the screen-reader prefix when it does not', () => {
    const named = (label: string) => {
      const replay = loadedReplay();
      const ghosts = replay.ghosts.map((ghost, index) =>
        index === 0 ? { ...ghost, label } : ghost,
      );
      const tl = timelineOf(indexReplay({ ...replay, ghosts }));
      return mountComponent(ReplayEventFeed, {
        props: { entries: recentEvents(tl, 540), problems: REPLAY_PROBLEMS, context: ICPC },
      });
    };
    const ghostLine = (wrapper: ReturnType<typeof named>) =>
      wrapper.findAll('li')[1]!.findAll('span')[1]!.text().replace(/\s+/g, ' ');
    expect(ghostLine(named('Ghost · HSG 2024 #1'))).toBe('Ghost · HSG 2024 #1 giải A');
    expect(ghostLine(named('HSG 2024 #1'))).toBe('GhostHSG 2024 #1 giải A');
  });

  it('says nothing has happened before the first event, with Bit asleep', () => {
    const wrapper = feed(10);
    expect(wrapper.text()).toContain('Chưa có sự kiện nào.');
    expect(wrapper.find('[data-testid="inline-bit"]').exists()).toBe(true);
  });

  it('is headed but never a live region', () => {
    const wrapper = feed(3000);
    expect(wrapper.get('h2').text()).toBe('Vừa xảy ra');
    expect(wrapper.find('[aria-live]').exists()).toBe(false);
  });
});
