import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import StatGrid from './StatGrid.vue';

describe('StatGrid', () => {
  it('pairs each label with its value and optional hint', () => {
    const grid = mount(StatGrid, {
      props: {
        items: [
          { label: 'Đã giải', value: 42, hint: 'trên 100 bài' },
          { label: 'Hạng', value: '#7' },
        ],
      },
    });
    const pairs = grid.findAll('dl > div').map((pair) => ({
      label: pair.get('dt').text(),
      values: pair.findAll('dd').map((dd) => dd.text()),
    }));
    expect(pairs).toEqual([
      { label: 'Đã giải', values: ['42', 'trên 100 bài'] },
      { label: 'Hạng', values: ['#7'] },
    ]);
  });

  it('shows stat values as mono numbers and colours only toned values', () => {
    const grid = mount(StatGrid, {
      props: {
        mode: 'stat',
        items: [
          { label: 'AC', value: 9, tone: 'positive' },
          { label: 'WA', value: 2 },
        ],
      },
    });
    const toned = grid.findAll('dd')[0]!;
    const plain = grid.findAll('dd')[1]!;
    expect(toned.classes()).toEqual(
      expect.arrayContaining(['font-mono', 'tabular-nums', 'text-positive']),
    );
    expect(plain.classes()).not.toContain('text-positive');
  });
});
