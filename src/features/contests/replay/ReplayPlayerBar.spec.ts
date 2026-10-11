import { describe, expect, it } from 'vitest';
import { mountComponent } from '@/test/mount';
import ReplayPlayerBar from './ReplayPlayerBar.vue';

const props = (overrides: Record<string, unknown> = {}) => ({
  seconds: 5184,
  durationSeconds: 10_800,
  isPlaying: false,
  speed: 10,
  marks: [
    { problemId: 'prob-a', label: 'A', seconds: 540, percent: 5 },
    { problemId: 'prob-b', label: 'B', seconds: 1860, percent: 17.2 },
  ],
  ...overrides,
});

describe('ReplayPlayerBar', () => {
  it('keeps a held thumb where it was dragged while the clock runs, and follows the clock again on release', async () => {
    const wrapper = mountComponent(ReplayPlayerBar, { props: props({ isPlaying: true }) });
    const range = wrapper.get<HTMLInputElement>('input[type="range"]');
    await range.trigger('pointerdown');
    range.element.value = '600';
    await range.trigger('input');
    await wrapper.setProps({ seconds: 675 } as never);
    expect(range.element.value).toBe('600');
    await range.trigger('pointerup');
    expect(range.element.value).toBe('675');
    expect(wrapper.emitted('seek')).toEqual([[600]]);
  });

  it('lets go of the thumb when the pointer is released outside the slider', async () => {
    const wrapper = mountComponent(ReplayPlayerBar, { props: props({ isPlaying: true }) });
    const range = wrapper.get<HTMLInputElement>('input[type="range"]');
    await range.trigger('pointerdown');
    window.dispatchEvent(new Event('pointerup'));
    await wrapper.setProps({ seconds: 675 } as never);
    expect(range.element.value).toBe('675');
  });
});
