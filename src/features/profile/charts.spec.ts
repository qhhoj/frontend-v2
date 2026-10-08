import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ratingHistory } from '@/test/fixtures';
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

describe('profile charts', () => {
  it('names the rating chart with the contest count, the best and the current rating', () => {
    const chart = mountComponent(RatingChart, { props: { history: ratingHistory() } }).get(
      'svg[role="img"]',
    );
    expect(chart.attributes('aria-label')).toMatch(
      /^Biểu đồ rating qua \d+ kỳ thi, cao nhất \d+, hiện tại \d+$/,
    );
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
