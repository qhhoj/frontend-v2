import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { i18n } from '@/i18n';
import { ranking, rankingRow } from '@/test/fixtures';
import type { RankingContext } from '@/lib/ranking-cells';
import RankingTable from './RankingTable.vue';

const context: RankingContext = {
  formatName: 'default',
  pointsPrecision: 0,
  locale: 'en',
  showsTime: true,
};

describe('RankingTable', () => {
  it('shows a dash, not the sentinel score or a rank, for a disqualified row', () => {
    const row = { ...rankingRow(5, 'p1', 'cheater', -9999, 0, {}), isDisqualified: true };
    const wrapper = mount(RankingTable, {
      props: { ranking: ranking(), rows: [row], context, viewerId: null },
      global: { plugins: [i18n] },
    });
    const cells = wrapper.findAll('tbody tr td');
    expect(cells[0]!.text()).toBe('—');
    expect(cells[1]!.text()).toBe('—');
    expect(wrapper.text()).not.toContain('9999');
  });

  describe('rating change column', () => {
    const rated = (
      ratingChange: { rating: number; delta: number | null } | null,
      rank: number,
    ) => ({
      ...rankingRow(rank, `p${rank}`, `user_0${rank}`, 1, 0, {}),
      ratingChange,
    });
    const mountRows = (rows: ReturnType<typeof rated>[]) =>
      mount(RankingTable, {
        props: { ranking: ranking(), rows, context, viewerId: null },
        global: { plugins: [i18n] },
      });

    it('shows the change and the new rating per row once ratings are applied', () => {
      const wrapper = mountRows([
        rated({ rating: 1843, delta: 42 }, 1),
        rated({ rating: 1189, delta: -7 }, 2),
        rated({ rating: 1500, delta: null }, 3),
        rated(null, 4),
      ]);
      expect(wrapper.text()).toContain('Δ rating');
      const cells = wrapper.findAll('[data-testid="rating-change"]');
      expect(cells.map((cell) => cell.text())).toEqual(['+42 → 1843', '-7 → 1189', '1500', '—']);
      expect(cells[0]!.classes()).toContain('text-positive');
      expect(cells[1]!.classes()).toContain('text-negative');
    });

    it('has no rating column before ratings are applied', () => {
      const wrapper = mountRows([rated(null, 1)]);
      expect(wrapper.text()).not.toContain('Δ rating');
      expect(wrapper.find('[data-testid="rating-change"]').exists()).toBe(false);
    });
  });

  describe('cell links', () => {
    const cell = { time: 100, points: 1, penalty: 0, tries: 1 } as never;
    const rows = () => [
      rankingRow(1, 'p1', 'bitcoder', 1, 0, { [ranking().problems[0]!.problemId]: cell }),
    ];
    const mountWith = (extra: Record<string, unknown>) =>
      mount(RankingTable, {
        props: { ranking: ranking(), rows: rows(), context, viewerId: null, ...extra },
        global: {
          plugins: [i18n],
          stubs: {
            RouterLink: { props: ['to'], template: '<a :href="JSON.stringify(to)"><slot /></a>' },
          },
        },
      });

    it('links an attempted cell to the contest submissions of that user and problem', () => {
      const links = mountWith({ contestKey: 'c1' }).findAll('tbody td a');
      expect(links).toHaveLength(1);
      expect(JSON.parse(links[0]!.attributes('href')!)).toMatchObject({
        params: { key: 'c1' },
        query: { user: 'bitcoder', problem: 'r42a' },
      });
    });

    it("links the user name to that user's contest submissions", () => {
      const nameLink = (extra: Record<string, unknown>) =>
        JSON.parse(mountWith(extra).find('tbody th a').attributes('href')!);
      expect(nameLink({ contestKey: 'c1' })).toMatchObject({ query: { user: 'bitcoder' } });
    });

    it('does not link other users when the viewer sees only own submissions', () => {
      expect(
        mountWith({ contestKey: 'c1', ownSubmissionsOnly: true }).findAll('tbody td a'),
      ).toHaveLength(0);
    });
  });
});
