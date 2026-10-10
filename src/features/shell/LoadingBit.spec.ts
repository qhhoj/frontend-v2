import type { VueWrapper } from '@vue/test-utils';
import { nextTick } from 'vue';
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

  it('turns each Bit toward the nearest edge once, at its own speed', async () => {
    const wrapper = mountBits('walking');
    for (let frame = 1; frame <= 50; frame++) frames.runFrame(frame * 16);
    const before = coordinates(wrapper);
    await wrapper.setProps({ phase: 'leaving' });
    frames.runFrame(50 * 16 + 16);
    frames.runFrame(50 * 16 + 32);
    const after = coordinates(wrapper);
    after.forEach((now, index) => {
      const was = before[index]!;
      const distances = [was.x + 64, 1280 - was.x, was.y + 70, 800 - was.y + 6];
      const nearest = distances.indexOf(Math.min(...distances));
      const moved = [was.x - now.x, now.x - was.x, was.y - now.y, now.y - was.y][nearest]!;
      expect(moved).toBeGreaterThan(0);
    });
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

  it('brings a Bit that already left back toward the middle', async () => {
    setViewport(1280, 800);
    const wrapper = mountBits('leaving');
    let timestamp = 0;
    for (let frame = 0; frame < 4000 && !wrapper.emitted('gone'); frame++)
      frames.runFrame((timestamp += 16));
    await wrapper.setProps({ phase: 'walking' });
    const distances = () => coordinates(wrapper).map(({ x, y }) => Math.hypot(x - 608, y - 368));
    const gone = distances();
    for (let frame = 0; frame < 25; frame++) frames.runFrame((timestamp += 16));
    distances().forEach((distance, index) => expect(distance).toBeLessThan(gone[index]!));
  });

  it('skips the exit when the tab is hidden while leaving', async () => {
    const wrapper = mountBits('walking');
    await wrapper.setProps({ phase: 'leaving' });
    expect(wrapper.emitted('gone')).toBeUndefined();
    setTabHidden(true);
    expect(wrapper.emitted('gone')).toHaveLength(1);
    const hiddenAtStart = mountBits('walking');
    await hiddenAtStart.setProps({ phase: 'leaving' });
    expect(hiddenAtStart.emitted('gone')).toHaveLength(1);
  });

  it('sends Bits in from fresh places for a new wait after they have gone', async () => {
    const wrapper = mountBits('walking');
    const first = positions(wrapper);
    await wrapper.setProps({ phase: 'hidden' });
    await wrapper.setProps({ phase: 'walking' });
    expect(positions(wrapper)).not.toEqual(first);
  });

  it('swaps the leg cells once a Bit has walked a step', async () => {
    const wrapper = mountBits('walking');
    const legs = () => wrapper.get('[data-testid="loading-bit"] .grid').html();
    const standing = legs();
    for (let frame = 1; frame <= 40; frame++) frames.runFrame(frame * 16);
    await nextTick();
    // 40 frames of at least 40 px/s cover well over one 6 px step; the leg frame is whichever one it lands on.
    const seen = new Set([standing]);
    for (let frame = 41; frame <= 80; frame++) {
      frames.runFrame(frame * 16);
      await nextTick();
      seen.add(legs());
    }
    expect(seen.size).toBeGreaterThan(1);
  });

  it('turns a Bit that walks west to face west, and east to face east', () => {
    const wrapper = mountBits('walking');
    const flips = new Set<string>();
    for (let frame = 1; frame <= 600; frame++) {
      frames.runFrame(frame * 16);
      flips.add((bits(wrapper)[0]!.element.firstElementChild as HTMLElement).style.transform);
    }
    expect(flips).toEqual(new Set(['scaleX(-1)', 'none']));
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
