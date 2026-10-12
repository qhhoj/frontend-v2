import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import ProgressBar from './ProgressBar.vue';

const mountBar = (value: number, max?: number) =>
  mount(ProgressBar, { props: { value, max, label: 'Bộ nhớ' } });
const fillWidth = (bar: ReturnType<typeof mountBar>) =>
  (bar.get('[role="progressbar"] > div').element as HTMLElement).style.width;

describe('ProgressBar', () => {
  it('fills by value over max and announces both', () => {
    const bar = mountBar(3, 12);
    const meter = bar.get('[role="progressbar"]');
    expect(meter.attributes()).toMatchObject({
      'aria-valuenow': '3',
      'aria-valuemax': '12',
      'aria-label': 'Bộ nhớ',
    });
    expect(fillWidth(bar)).toBe('25%');
  });

  it('clamps a value outside 0..max', () => {
    expect(fillWidth(mountBar(150))).toBe('100%');
    expect(mountBar(150).get('[role="progressbar"]').attributes('aria-valuenow')).toBe('100');
    expect(fillWidth(mountBar(-5))).toBe('0%');
  });

  it('shows an empty bar when max is zero', () => {
    expect(fillWidth(mountBar(4, 0))).toBe('0%');
  });
});
