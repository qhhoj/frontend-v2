import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { RatingHistoryEntry } from '@/api/types/users';
import { activity } from '@/test/community-fixtures';
import { mockApi } from '@/test/mock-api';
import { mountComponent } from '@/test/mount';
import { anonymousViewer } from '@/test/problem-routes';
import ActivityHeatmap from './ActivityHeatmap.vue';
import RatingChart from './RatingChart.vue';

beforeEach(() => {
  mockApi({ ...anonymousViewer });
  // Pinned so the heatmap's "today" (and so its 53 weeks) does not drift with the real clock.
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-10-08T12:00:00+07:00'));
});
afterEach(() => vi.useRealTimers());

const contest = (
  endTime: string,
  rating: number | null,
  contestName: string | null,
): RatingHistoryEntry => ({
  contestKey: contestName ? 'key' : null,
  contestName,
  endTime,
  rating,
  rank: 1,
  performance: null,
});
/** Three rated contests (best 1650 in the middle, current 1600 last) and one unrated entry that must not count. */
const history = (): RatingHistoryEntry[] => [
  contest('2026-08-01T10:00:00Z', 1500, 'Round A'),
  contest('2026-09-01T10:00:00Z', 1650, 'Round B'),
  contest('2026-09-15T10:00:00Z', null, null),
  contest('2026-10-01T10:00:00Z', 1600, 'Round C'),
];

describe('profile charts', () => {
  it('names the rating chart with the exact contest count, best and current rating', () => {
    const chart = mountComponent(RatingChart, { props: { history: history() } }).get(
      'svg[role="group"]',
    );
    expect(chart.attributes('aria-label')).toBe(
      'Biểu đồ rating qua 3 kỳ thi, cao nhất 1650, hiện tại 1600',
    );
  });
  it('shows the four figures, the change since the previous contest and tier names at the edge', () => {
    const wrapper = mountComponent(RatingChart, { props: { history: history() } });
    const stats = wrapper.get('[data-testid="rating-stats"]').text();
    expect(stats).toContain('1600');
    expect(stats).toContain('1650');
    expect(stats).toContain('-50');
    expect(wrapper.text()).toContain('Specialist');
    expect(wrapper.text()).not.toContain('Cao nhất 1650');
  });
  it('names each contest on the axis when there are few, and gives every contest a focusable tooltip target', () => {
    const wrapper = mountComponent(RatingChart, { props: { history: history() } });
    expect(wrapper.text()).toContain('Round B');
    const targets = wrapper.findAll('rect[tabindex="0"]');
    expect(targets).toHaveLength(3);
    expect(targets[1]!.attributes('aria-label')).toContain('Round B');
    expect(targets[1]!.attributes('aria-label')).toContain('(+150)');
  });
  it('draws nothing when no contest has a rating', () => {
    const unrated = [contest('2026-09-15T10:00:00Z', null, null)];
    expect(
      mountComponent(RatingChart, { props: { history: [] } })
        .find('svg')
        .exists(),
    ).toBe(false);
    expect(
      mountComponent(RatingChart, { props: { history: unrated } })
        .find('svg')
        .exists(),
    ).toBe(false);
  });
  it('gives each heatmap cell its date and count as text and says the zone', () => {
    const wrapper = mountComponent(ActivityHeatmap, {
      props: { activity: activity({ '2026-10-05': 5 }) },
    });
    expect(wrapper.get('svg[role="img"]').attributes('aria-label')).toBe(
      'Biểu đồ hoạt động nộp bài 53 tuần',
    );
    expect(wrapper.findAll('title').some((title) => title.text() === '2026-10-05: 5 bài nộp')).toBe(
      true,
    );
    expect(wrapper.text()).toContain('5 bài nộp trong 53 tuần qua · múi giờ Asia/Ho_Chi_Minh');
  });
});
