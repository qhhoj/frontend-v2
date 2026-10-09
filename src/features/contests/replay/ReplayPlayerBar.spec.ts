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
const speedButtons = (wrapper: ReturnType<typeof mountComponent>) =>
  wrapper.get('[role="group"]').findAll('button');

describe('ReplayPlayerBar', () => {
  it('shows the clock over the length and the scrub position, spoken as a time', () => {
    const wrapper = mountComponent(ReplayPlayerBar, { props: props() });
    expect(wrapper.text()).toContain('01:26:24');
    expect(wrapper.text()).toContain('/ 03:00:00');
    const range = wrapper.get('input[type="range"]');
    expect(range.attributes('aria-label')).toBe('Thời điểm phát lại');
    expect(range.attributes('aria-valuetext')).toBe('01:26:24');
    expect(range.attributes('max')).toBe('10800');
  });

  it('plays when paused and pauses when playing, with a matching label', async () => {
    const paused = mountComponent(ReplayPlayerBar, { props: props() });
    await paused.get('button').trigger('click');
    expect(paused.emitted('play')).toHaveLength(1);
    expect(paused.get('button').text()).toBe('Phát');
    const playing = mountComponent(ReplayPlayerBar, { props: props({ isPlaying: true }) });
    await playing.get('button').trigger('click');
    expect(playing.emitted('pause')).toHaveLength(1);
    expect(playing.get('button').text()).toBe('Tạm dừng');
  });

  it('offers the four speeds with the current one pressed and emits the chosen one', async () => {
    const wrapper = mountComponent(ReplayPlayerBar, { props: props() });
    expect(
      speedButtons(wrapper).map((button) => [button.text(), button.attributes('aria-pressed')]),
    ).toEqual([
      ['x1', 'false'],
      ['x10', 'true'],
      ['x60', 'false'],
      ['x300', 'false'],
    ]);
    await speedButtons(wrapper)[3]!.trigger('click');
    expect(wrapper.emitted('speed')).toEqual([[300]]);
  });

  it('emits the scrubbed second', async () => {
    const wrapper = mountComponent(ReplayPlayerBar, { props: props() });
    await wrapper.get('input[type="range"]').setValue('600');
    expect(wrapper.emitted('seek')).toEqual([[600]]);
  });

  it('draws one decorative dot per first solve at its place on the track', () => {
    const wrapper = mountComponent(ReplayPlayerBar, { props: props() });
    const dots = wrapper.findAll('[data-testid="solve-mark"]');
    expect(dots.map((dot) => dot.attributes('style'))).toEqual(['left: 5%;', 'left: 17.2%;']);
    expect(dots.every((dot) => dot.attributes('aria-hidden') === 'true')).toBe(true);
    expect(wrapper.text()).toContain('Chấm xanh: lần giải đầu của từng bài');
  });
});
