import type { VueWrapper } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { stubMatchMedia } from '@/test/match-media';
import { mountComponent } from '@/test/mount';
import { fakeAnimationFrames } from '@/test/animation-frames';
import { seededRandom } from '@/test/seeded-random';
import LoadingBit from './LoadingBit.vue';
import type { LoadingPhase } from './use-loading-phase';

type Mounted = VueWrapper<InstanceType<typeof LoadingBit>>;
const mountBits = (phase: LoadingPhase) =>
  mountComponent(LoadingBit, { props: { phase } }) as unknown as Mounted;

const setViewport = (width: number, height = 800) => {
  Object.defineProperty(document.documentElement, 'clientWidth', {
    value: width,
    configurable: true,
  });
  Object.defineProperty(document.documentElement, 'clientHeight', {
    value: height,
    configurable: true,
  });
};
const setTabHidden = (hidden: boolean) => {
  Object.defineProperty(document, 'hidden', { value: hidden, configurable: true });
  document.dispatchEvent(new Event('visibilitychange'));
};

describe('LoadingBit', () => {
  let frames: ReturnType<typeof fakeAnimationFrames>;
  beforeEach(() => {
    vi.useFakeTimers();
    frames = fakeAnimationFrames();
    vi.spyOn(Math, 'random').mockImplementation(seededRandom(7));
    setViewport(1280);
  });
  afterEach(() => {
    setTabHidden(false);
    vi.restoreAllMocks();
    vi.useRealTimers();
    setViewport(1024, 768);
  });

  const bits = (wrapper: Mounted) => wrapper.findAll('[data-testid="loading-bit"]');
  const positions = (wrapper: Mounted) => bits(wrapper).map((bit) => bit.attributes('style'));

  it('runs one animation loop for all Bits, moves them every frame and stops it when hidden', async () => {
    const wrapper = mountBits('walking');
    await vi.advanceTimersByTimeAsync(0);
    expect(frames.request).toHaveBeenCalledTimes(1);
    const before = positions(wrapper);
    frames.runFrame(16);
    frames.runFrame(32);
    expect(frames.request).toHaveBeenCalledTimes(3);
    expect(positions(wrapper)).not.toEqual(before);
    await wrapper.setProps({ phase: 'hidden' });
    expect(frames.cancel).toHaveBeenCalled();
    expect(frames.isQueued()).toBe(false);
  });

  it('pauses while the tab is hidden and resumes when it is back', async () => {
    const wrapper = mountBits('walking');
    frames.runFrame(16);
    setTabHidden(true);
    expect(frames.isQueued()).toBe(false);
    const requests = frames.request.mock.calls.length;
    await vi.advanceTimersByTimeAsync(2000);
    expect(frames.request).toHaveBeenCalledTimes(requests);
    setTabHidden(false);
    expect(frames.isQueued()).toBe(true);
    // The first frame after a pause starts a fresh clock, so nothing jumps.
    const resting = positions(wrapper);
    frames.runFrame(60_000);
    expect(positions(wrapper)).toEqual(resting);
  });

  it('does not start a loop when it appears in a hidden tab, and cancels it on unmount', () => {
    setTabHidden(true);
    const hiddenTab = mountBits('walking');
    expect(frames.request).not.toHaveBeenCalled();
    hiddenTab.unmount();
    setTabHidden(false);
    const wrapper = mountBits('walking');
    expect(frames.isQueued()).toBe(true);
    wrapper.unmount();
    expect(frames.isQueued()).toBe(false);
  });

  const coordinates = (wrapper: Mounted) =>
    bits(wrapper).map((bit) => {
      const [, left, top] = /translate\((-?[\d.]+)px, (-?[\d.]+)px\)/.exec(
        bit.attributes('style') ?? '',
      )!;
      return { x: Number(left), y: Number(top) };
    });

  it('keeps walking while leaving, never stopping or blinking, and emits gone once every Bit is out', async () => {
    const wrapper = mountBits('walking');
    frames.runFrame(16);
    await wrapper.setProps({ phase: 'leaving' });
    expect(frames.isQueued()).toBe(true);
    const start = coordinates(wrapper);
    let timestamp = 16;
    for (let frame = 0; frame < 20; frame++) frames.runFrame((timestamp += 16));
    expect(coordinates(wrapper)).not.toEqual(start);
    expect(wrapper.findAll('[data-blinking="true"]')).toHaveLength(0);
    expect(wrapper.emitted('gone')).toBeUndefined();
    // 120 px/s at most: a 1280 px wide viewport is crossed well within a minute of frames.
    for (let frame = 0; frame < 4000 && !wrapper.emitted('gone'); frame++)
      frames.runFrame((timestamp += 16));
    expect(wrapper.emitted('gone')).toBeDefined();
    for (const { x, y } of coordinates(wrapper))
      expect(x < -64 || x > 1280 || y < -70 || y > 806).toBe(true);
  });

  it('keeps walking while the layer fades, and walks back in for a new wait', async () => {
    const wrapper = mountBits('walking');
    frames.runFrame(16);
    await wrapper.setProps({ phase: 'leaving' });
    frames.runFrame(32);
    await wrapper.setProps({ phase: 'fading' });
    expect(wrapper.get('[data-testid="loading-bits"]').classes()).toContain('opacity-0');
    const fading = positions(wrapper);
    frames.runFrame(48);
    const walkedOn = positions(wrapper);
    expect(walkedOn).not.toEqual(fading);
    await wrapper.setProps({ phase: 'walking' });
    expect(wrapper.get('[data-testid="loading-bits"]').classes()).toContain('opacity-100');
    expect(positions(wrapper)).toEqual(walkedOn);
    expect(frames.isQueued()).toBe(true);
  });

  it('puts the Bit in its corner when reduced motion turns on mid-walk', async () => {
    const media = stubMatchMedia();
    const wrapper = mountBits('walking');
    frames.runFrame(16);
    expect(bits(wrapper)[0]!.attributes('style')).toContain('translate(');
    media.setReducedMotion(true);
    await vi.advanceTimersByTimeAsync(0);
    expect(bits(wrapper)).toHaveLength(1);
    expect((bits(wrapper)[0]!.element as HTMLElement).style.transform).toBe('');
    expect((bits(wrapper)[0]!.element.firstElementChild as HTMLElement).style.transform).toBe('');
  });

  it('under reduced motion stands one Bit in a corner, never animates, and is gone as soon as loading ends', async () => {
    stubMatchMedia({ reducedMotion: true });
    const wrapper = mountBits('walking');
    expect(bits(wrapper)).toHaveLength(1);
    expect(bits(wrapper)[0]!.classes()).toEqual(expect.arrayContaining(['bottom-4', 'left-4']));
    expect(frames.request).not.toHaveBeenCalled();
    await wrapper.setProps({ phase: 'leaving' });
    expect(wrapper.emitted('gone')).toHaveLength(1);
    expect(frames.request).not.toHaveBeenCalled();
    await wrapper.setProps({ phase: 'hidden' });
    expect(bits(wrapper)).toHaveLength(0);
  });
});
