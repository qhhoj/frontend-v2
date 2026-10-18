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

  it('stops every Bit where it stands when the layer fades, and walks on from there for a new wait', async () => {
    const wrapper = mountBits('walking');
    frames.runFrame(16);
    frames.runFrame(32);
    await wrapper.setProps({ phase: 'fading' });
    expect(wrapper.get('[data-testid="loading-bits"]').classes()).toContain('opacity-0');
    expect(frames.isQueued()).toBe(false);
    const stopped = positions(wrapper);
    frames.runFrame(48);
    expect(positions(wrapper)).toEqual(stopped);
    await wrapper.setProps({ phase: 'walking' });
    expect(wrapper.get('[data-testid="loading-bits"]').classes()).toContain('opacity-100');
    expect(positions(wrapper)).toEqual(stopped);
    expect(frames.isQueued()).toBe(true);
  });

  /** A public header 1280 px wide in a 1440 px viewport, 32 px padding: the content column runs from 112 to 1328. */
  const addPageColumn = () => {
    const header = document.createElement('header');
    header.dataset.pageColumn = '';
    header.style.paddingLeft = '32px';
    header.style.paddingRight = '32px';
    vi.spyOn(header, 'getBoundingClientRect').mockReturnValue(
      DOMRect.fromRect({ x: 80, y: 0, width: 1280, height: 72 }),
    );
    document.body.append(header);
    return header;
  };

  it('keeps every Bit in the gutters beside the content column, all the way up and down', () => {
    setViewport(1440, 900);
    const header = addPageColumn();
    const wrapper = mountBits('walking');
    const seenY = new Set<number>();
    for (let frame = 1; frame <= 600; frame++) {
      frames.runFrame(frame * 16);
      for (const { x, y } of coordinates(wrapper)) {
        expect(x <= 112 - 64 || x >= 1328, `x ${x} is in a gutter`).toBe(true);
        seenY.add(Math.round(y / 100));
      }
    }
    expect(seenY.size).toBeGreaterThan(3);
    header.remove();
  });

  it('walks along the bottom of the viewport where the gutters are too narrow to walk in', () => {
    setViewport(390, 844);
    const wrapper = mountBits('walking');
    for (let frame = 1; frame <= 300; frame++) {
      frames.runFrame(frame * 16);
      for (const { y } of coordinates(wrapper)) expect(y).toBeGreaterThanOrEqual(844 - 64 - 32 - 6);
    }
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

  it('under reduced motion stands one Bit in a corner and never animates, not even while it fades', async () => {
    stubMatchMedia({ reducedMotion: true });
    const wrapper = mountBits('walking');
    expect(bits(wrapper)).toHaveLength(1);
    expect(bits(wrapper)[0]!.classes()).toEqual(expect.arrayContaining(['bottom-4', 'left-4']));
    expect(frames.request).not.toHaveBeenCalled();
    await wrapper.setProps({ phase: 'fading' });
    expect(frames.request).not.toHaveBeenCalled();
    await wrapper.setProps({ phase: 'hidden' });
    expect(bits(wrapper)).toHaveLength(0);
  });
});
