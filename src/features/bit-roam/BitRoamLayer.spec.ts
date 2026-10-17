import { flushPromises } from '@vue/test-utils';
import type { VueWrapper } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeAnimationFrames } from '@/test/animation-frames';
import { staffViewer } from '@/test/admin-routes';
import { participationSummary, profile, signedIn, signedOut } from '@/test/fixtures';
import { stubMatchMedia } from '@/test/match-media';
import { mockApi, ok, page } from '@/test/mock-api';
import type { MockHandler } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { seededRandom } from '@/test/seeded-random';

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
const withBits = (count: number, extra: Record<string, MockHandler> = {}) => ({
  'GET /auth/me': signedIn(),
  'GET /profile': ok(profile({ bitRoam: { on: true, count } })),
  'GET /contests/current': ok(null),
  ...extra,
});
const bits = (wrapper: VueWrapper) => wrapper.findAll('[data-testid="roaming-bit"]');
const layer = (wrapper: VueWrapper) => wrapper.find('[data-testid="roaming-bits"]');

describe('BitRoamLayer', () => {
  let frames: ReturnType<typeof fakeAnimationFrames>;
  beforeEach(() => {
    frames = fakeAnimationFrames();
    vi.spyOn(Math, 'random').mockImplementation(seededRandom(3));
    setViewport(1280);
    // jsdom has no layout: nothing lies under a Bit unless a test says so.
    document.elementFromPoint = () => null;
  });
  afterEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  /** Plays frames until some Bit rests (takes clicks), and returns it. */
  const runUntilResting = (wrapper: VueWrapper, forMs = 120_000) => {
    for (let time = 16; time < forMs; time += 16) {
      frames.runFrame(time);
      const resting = bits(wrapper).find(
        (bit) => (bit.element as HTMLElement).style.pointerEvents === 'auto',
      );
      if (resting) return resting;
    }
    throw new Error('no Bit rested');
  };

  it('shows nothing while the viewer has them off (the default)', async () => {
    mockApi({ 'GET /auth/me': signedIn(), 'GET /profile': ok(profile()) });
    const { wrapper } = await mountApp('/settings/appearance');
    expect(layer(wrapper).exists()).toBe(false);
  });

  it('walks the chosen number of Bits in an aria-hidden layer that takes no clicks', async () => {
    mockApi(withBits(5));
    const { wrapper } = await mountApp('/settings/appearance');
    expect(bits(wrapper)).toHaveLength(5);
    expect(layer(wrapper).attributes('aria-hidden')).toBe('true');
    expect(layer(wrapper).classes()).toContain('pointer-events-none');
    frames.runFrame(16);
    frames.runFrame(32);
    for (const bit of bits(wrapper)) {
      expect((bit.element as HTMLElement).style.transform).toMatch(/^translate\(/);
      expect(bit.attributes('tabindex')).toBeUndefined();
    }
  });

  it('keeps phones to 3 Bits', async () => {
    setViewport(390);
    mockApi(withBits(5));
    const { wrapper } = await mountApp('/settings/appearance');
    expect(bits(wrapper)).toHaveLength(3);
  });

  it('follows a guest’s choice kept in this browser', async () => {
    localStorage.setItem('qhhoj.bitRoam', JSON.stringify({ on: true, count: 2 }));
    mockApi({ 'GET /auth/me': signedOut });
    const { wrapper } = await mountApp('/settings/appearance');
    expect(bits(wrapper)).toHaveLength(2);
  });

  it('stays away inside a live contest', async () => {
    mockApi(
      withBits(3, {
        'GET /contests/current': ok({
          contest: {
            key: 'r41',
            name: 'Round 41',
            startTime: '2026-10-01T08:00:00Z',
            endTime: '2999-01-01T00:00:00Z',
          },
          participation: participationSummary({ virtual: 0, endTime: '2999-01-01T00:00:00Z' }),
        }),
        // The shell alerts the contest's announcements.
        'GET /contests/r41/announcements': page([]),
      }),
    );
    const { wrapper } = await mountApp('/settings/appearance');
    expect(layer(wrapper).exists()).toBe(false);
  });

  it('stays away from admin pages', async () => {
    mockApi({
      ...staffViewer(['judge.change_miscconfig']),
      'GET /profile': ok(profile({ bitRoam: { on: true, count: 3 } })),
      'GET /contests/current': ok(null),
      'GET /site/config': ok([]),
    });
    const { wrapper, router } = await mountApp('/settings/appearance');
    expect(bits(wrapper)).toHaveLength(3);
    await router.push('/admin/config');
    await flushPromises();
    expect(layer(wrapper).exists()).toBe(false);
  });

  it('shows one still Bit in the corner under reduced motion, taking no clicks', async () => {
    stubMatchMedia({ reducedMotion: true });
    mockApi(withBits(5));
    const { wrapper } = await mountApp('/settings/appearance');
    expect(bits(wrapper)).toHaveLength(1);
    expect(frames.isQueued()).toBe(false);
    expect(bits(wrapper)[0]!.classes()).toContain('left-4');
    expect((bits(wrapper)[0]!.element as HTMLElement).style.pointerEvents).not.toBe('auto');
  });

  it('never rests on a link, button or field, so it never takes a click meant for one', async () => {
    mockApi(withBits(3));
    const button = document.createElement('button');
    document.body.append(button);
    document.elementFromPoint = () => button;
    const { wrapper } = await mountApp('/settings/appearance');
    expect(() => runUntilResting(wrapper, 20_000)).toThrow('no Bit rested');
  });

  it('a tap on a resting Bit sends up hearts', async () => {
    mockApi(withBits(2));
    const { wrapper } = await mountApp('/settings/appearance');
    const resting = runUntilResting(wrapper);
    await resting.trigger('click');
    expect(resting.find('.bit-heart').exists()).toBe(true);
  });

  it('a double click shoos every Bit for the session, and "Gọi lại" brings them back', async () => {
    mockApi(withBits(3));
    const { wrapper } = await mountApp('/settings/appearance');
    const resting = runUntilResting(wrapper);
    await resting.trigger('dblclick');
    expect(sessionStorage.getItem('qhhoj.bitRoamResting')).toBe('1');
    const toast = document.querySelector('[data-testid="admin-toasts"]')!;
    expect(toast.textContent).toContain('Bit đi nghỉ đến hết phiên này');
    for (let time = 0; time < 20_000 && layer(wrapper).exists(); time += 16) {
      frames.runFrame(100_000 + time);
      await flushPromises();
    }
    expect(layer(wrapper).exists()).toBe(false);
    const callBack = [...toast.querySelectorAll('button')].find(
      (button) => button.textContent?.trim() === 'Gọi lại',
    )!;
    callBack.click();
    await flushPromises();
    expect(sessionStorage.getItem('qhhoj.bitRoamResting')).not.toBe('1');
    expect(bits(wrapper)).toHaveLength(3);
  });

  it('a 0.5 s hold shoos them too', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    mockApi(withBits(1));
    const { wrapper } = await mountApp('/settings/appearance');
    const resting = runUntilResting(wrapper);
    await resting.trigger('pointerdown');
    vi.advanceTimersByTime(499);
    expect(sessionStorage.getItem('qhhoj.bitRoamResting')).not.toBe('1');
    vi.advanceTimersByTime(1);
    expect(sessionStorage.getItem('qhhoj.bitRoamResting')).toBe('1');
    vi.useRealTimers();
  });
});
