import type { VueWrapper } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { stubMatchMedia } from '@/test/match-media';
import { mountComponent } from '@/test/mount';
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

/** requestAnimationFrame that queues callbacks; `runFrame(timestamp)` plays the queued one. */
function fakeAnimationFrames() {
  let queued: FrameRequestCallback | undefined;
  const request = vi.fn((callback: FrameRequestCallback) => {
    queued = callback;
    return request.mock.calls.length;
  });
  const cancel = vi.fn(() => (queued = undefined));
  vi.stubGlobal('requestAnimationFrame', request);
  vi.stubGlobal('cancelAnimationFrame', cancel);
  return {
    request,
    cancel,
    isQueued: () => queued !== undefined,
    runFrame(timestamp: number) {
      const callback = queued;
      queued = undefined;
      callback?.(timestamp);
    },
  };
}

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

  it('renders nothing while hidden', () => {
    expect(bits(mountBits('hidden'))).toHaveLength(0);
  });

  it('shows five different Bits on a desktop, three on a phone, none of them reachable or announced', () => {
    const desktop = mountBits('walking');
    expect(bits(desktop)).toHaveLength(5);
    const headgears = new Set(bits(desktop).map((bit) => bit.attributes('data-headgear')));
    expect(headgears.size).toBe(5);
    const layer = desktop.get('[data-testid="loading-bits"]');
    expect(layer.attributes('aria-hidden')).toBe('true');
    expect(layer.classes()).toEqual(
      expect.arrayContaining(['pointer-events-none', 'fixed', 'z-40']),
    );
    setViewport(375);
    expect(bits(mountBits('walking'))).toHaveLength(3);
  });

  it('measures the viewport without the scrollbar', () => {
    setViewport(500, 400);
    const wrapper = mountBits('walking');
    for (let frame = 1; frame <= 200; frame++) frames.runFrame(frame * 16);
    const maxX = 500 - 64;
    for (const bit of bits(wrapper)) {
      const [, left, top] = /translate\((-?[\d.]+)px, (-?[\d.]+)px\)/.exec(
        bit.attributes('style') ?? '',
      )!;
      expect(Number(left)).toBeLessThanOrEqual(maxX);
      expect(Number(top)).toBeLessThanOrEqual(400 - 64);
    }
  });

  it('runs one animation loop for all Bits, moves them every frame and stops it when they stop', async () => {
    const wrapper = mountBits('walking');
    await vi.advanceTimersByTimeAsync(0);
    expect(frames.request).toHaveBeenCalledTimes(1);
    const before = positions(wrapper);
    frames.runFrame(16);
    frames.runFrame(32);
    expect(frames.request).toHaveBeenCalledTimes(3);
    expect(positions(wrapper)).not.toEqual(before);
    await wrapper.setProps({ phase: 'stopped' });
    expect(frames.cancel).toHaveBeenCalled();
    expect(frames.isQueued()).toBe(false);
    const stopped = positions(wrapper);
    frames.runFrame(48);
    expect(positions(wrapper)).toEqual(stopped);
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

  it('blinks once when it stops, then fades and goes', async () => {
    const wrapper = mountBits('walking');
    expect(wrapper.findAll('[data-blinking="true"]')).toHaveLength(0);
    await wrapper.setProps({ phase: 'stopped' });
    expect(wrapper.findAll('[data-blinking="true"]')).toHaveLength(5);
    await vi.advanceTimersByTimeAsync(200);
    expect(wrapper.findAll('[data-blinking="true"]')).toHaveLength(0);
    await vi.advanceTimersByTimeAsync(5000);
    expect(wrapper.findAll('[data-blinking="true"]')).toHaveLength(0);
    expect(wrapper.get('[data-testid="loading-bits"]').classes()).toContain('opacity-100');
    await wrapper.setProps({ phase: 'fading' });
    expect(wrapper.get('[data-testid="loading-bits"]').classes()).toContain('opacity-0');
    await wrapper.setProps({ phase: 'hidden' });
    expect(bits(wrapper)).toHaveLength(0);
  });

  it('keeps a Bit where it stopped and walks on from there', async () => {
    const wrapper = mountBits('walking');
    frames.runFrame(16);
    frames.runFrame(32);
    await wrapper.setProps({ phase: 'stopped' });
    const stopped = positions(wrapper);
    await wrapper.setProps({ phase: 'walking' });
    expect(positions(wrapper)).toEqual(stopped);
    expect(frames.isQueued()).toBe(true);
  });

  it('sends Bits in from fresh places for a new wait after they have gone', async () => {
    const wrapper = mountBits('walking');
    const first = positions(wrapper);
    await wrapper.setProps({ phase: 'hidden' });
    await wrapper.setProps({ phase: 'walking' });
    expect(positions(wrapper)).not.toEqual(first);
  });

  it('under reduced motion stands one Bit in a corner, never animates, never blinks, and still goes', async () => {
    stubMatchMedia({ reducedMotion: true });
    const wrapper = mountBits('walking');
    expect(bits(wrapper)).toHaveLength(1);
    expect(bits(wrapper)[0]!.classes()).toEqual(expect.arrayContaining(['bottom-4', 'left-4']));
    expect(frames.request).not.toHaveBeenCalled();
    await wrapper.setProps({ phase: 'stopped' });
    expect(wrapper.findAll('[data-blinking="true"]')).toHaveLength(0);
    await wrapper.setProps({ phase: 'fading' });
    expect(wrapper.get('[data-testid="loading-bits"]').classes()).toContain('opacity-0');
    await wrapper.setProps({ phase: 'hidden' });
    expect(bits(wrapper)).toHaveLength(0);
  });
});
