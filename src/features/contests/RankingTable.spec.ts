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
});
