import { flushPromises } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import { describe, expect, it } from 'vitest';
import { sessionUser, signedIn } from '@/test/fixtures';
import { mockApi, ok } from '@/test/mock-api';
import type { MockHandler } from '@/test/mock-api';
import { mountComponent } from '@/test/mount';
import { anonymousViewer } from '@/test/problem-routes';
import { useOfficialMode } from './official-mode.queries';

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
