import { flushPromises } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { sessionUser, signedIn } from '@/test/fixtures';
import { mockApi, ok, sequence } from '@/test/mock-api';
import type { MockHandler } from '@/test/mock-api';
import { mountComponent } from '@/test/mount';
import { anonymousViewer } from '@/test/problem-routes';
import { useOfficialMode, useRefetchWhenOfficialModeEnds } from './official-mode.queries';

const Probe = defineComponent({
  setup() {
    const mode = useOfficialMode();
    return () => h('p', `${mode.isActive.value}/${mode.isLocked.value}/${mode.isExempt.value}`);
  },
});
const site = (officialMode: boolean) => ({
  'GET /site': ok({ navigation: [], config: {}, officialMode }),
});
const asMember = { 'GET /auth/me': signedIn() };
const asSuperuser = { 'GET /auth/me': signedIn({ user: sessionUser({ isSuperuser: true }) }) };

async function probe(viewer: Record<string, MockHandler>, officialMode: boolean) {
  const calls = mockApi({ ...viewer, ...site(officialMode) });
  const wrapper = mountComponent(Probe);
  await flushPromises();
  return { text: wrapper.text(), siteCalls: calls.filter((call) => call.path === '/site') };
}

describe('useOfficialMode', () => {
  it('locks a signed-in member while the mode is on', async () => {
    expect((await probe(asMember, true)).text).toBe('true/true/false');
  });

  it('exempts a superuser: active but not locked', async () => {
    expect((await probe(asSuperuser, true)).text).toBe('true/false/true');
  });

  it('locks nobody while the mode is off', async () => {
    expect((await probe(asMember, false)).text).toBe('false/false/false');
  });

  it('asks nothing for an anonymous viewer', async () => {
    const result = await probe(anonymousViewer, true);
    expect(result.text).toBe('false/false/false');
    expect(result.siteCalls).toHaveLength(0);
  });
});

describe('official mode on an open page (fake timers)', () => {
  afterEach(() => vi.useRealTimers());
  const START = new Date('2026-10-10T10:00:00Z');
  const secondsFromStart = (seconds: number) =>
    new Date(START.getTime() + seconds * 1000).toISOString();
  const Watcher = defineComponent({
    setup() {
      const mode = useOfficialMode();
      useRefetchWhenOfficialModeEnds();
      return () => h('p', String(mode.isActive.value));
    },
  });

  async function mountWatching(sites: ReturnType<typeof ok>[]) {
    vi.useFakeTimers({
      toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'],
    });
    vi.setSystemTime(START);
    const calls = mockApi({ ...asMember, 'GET /site': sequence(...sites) });
    const wrapper = mountComponent(Watcher);
    await vi.advanceTimersByTimeAsync(0);
    const siteCalls = () => calls.filter((call) => call.path === '/site').length;
    return { wrapper, siteCalls };
  }
  const on = (endsInSeconds: number | null) =>
    ok({
      navigation: [],
      config: {},
      officialMode: true,
      officialModeEndsAt: endsInSeconds === null ? null : secondsFromStart(endsInSeconds),
    });
  const off = ok({ navigation: [], config: {}, officialMode: false });

  it('refetches /site the moment the countdown reaches its end and drops the lock', async () => {
    const { wrapper, siteCalls } = await mountWatching([on(10), off]);
    expect(wrapper.text()).toBe('true');
    await vi.advanceTimersByTimeAsync(9_000);
    expect(siteCalls()).toBe(1);
    await vi.advanceTimersByTimeAsync(1_000);
    expect(siteCalls()).toBe(2);
    expect(wrapper.text()).toBe('false');
  });

  it('polls every 30 s while the mode is on, without an end time', async () => {
    const { siteCalls } = await mountWatching([on(null)]);
    await vi.advanceTimersByTimeAsync(29_000);
    expect(siteCalls()).toBe(1);
    await vi.advanceTimersByTimeAsync(1_000);
    expect(siteCalls()).toBe(2);
  });

  it('polls slowly while off, and shows a mode switched on meanwhile', async () => {
    const { wrapper, siteCalls } = await mountWatching([off, on(null)]);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(siteCalls()).toBe(1);
    await vi.advanceTimersByTimeAsync(4 * 60_000);
    expect(siteCalls()).toBe(2);
    expect(wrapper.text()).toBe('true');
  });

  it('does not set a timer for an end that already passed', async () => {
    const { siteCalls } = await mountWatching([on(-5)]);
    await vi.advanceTimersByTimeAsync(10_000);
    expect(siteCalls()).toBe(1);
  });
});
