import { flushPromises } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import { describe, expect, it } from 'vitest';
import { useSessionStore } from '@/stores/session.store';
import { siteLook } from '@/theme/appearance';
import { useAppearanceStore } from '@/theme/appearance.store';
import { useThemeStore } from '@/theme/theme.store';
import { profile, sessionUser, signedOut } from '@/test/fixtures';
import { mockApi, ok } from '@/test/mock-api';
import { mountComponent } from '@/test/mount';
import { useAppearanceChoice } from './use-appearance-choice';

const root = document.documentElement;
const echoProfile = {
  'PATCH /profile': ({ body }: { body: unknown }) => ok(profile(body as object)),
};
const failedSave = {
  'PATCH /profile': { status: 500, body: { error: { code: 'internal_error', message: 'x' } } },
};

function mountChoice({ signedIn = false } = {}) {
  const wrapper = mountComponent(
    defineComponent({ setup: () => ({ choice: useAppearanceChoice() }), render: () => h('div') }),
  );
  if (signedIn) useSessionStore().$patch({ status: 'authenticated', user: sessionUser() });
  return (wrapper.vm as unknown as { choice: ReturnType<typeof useAppearanceChoice> }).choice;
}
const patches = (calls: Array<{ method: string; body: unknown }>) =>
  calls.filter((call) => call.method === 'PATCH').map((call) => call.body);

describe('appearance choice', () => {
  it('applies a change at once and sends nothing for an anonymous visitor', async () => {
    const calls = mockApi({ 'GET /auth/me': signedOut });
    const choice = mountChoice();
    await choice.update({ accent: 'mint' });
    expect(useAppearanceStore().look).toEqual({ ...siteLook('clay'), accent: 'mint' });
    expect(root.dataset.accent).toBe('mint');
    expect(patches(calls)).toEqual([]);
  });

  it("turns the look on from the active theme's own look: Orchid on a Glass theme", async () => {
    localStorage.setItem('qhhoj.theme', 'glass-dark');
    mockApi({ 'GET /auth/me': signedOut });
    const choice = mountChoice();
    expect(choice.shown.value).toEqual(siteLook('orchid'));
    await choice.update({ glass: 40 });
    expect(useAppearanceStore().look).toEqual({ accent: 'orchid', glass: 40, glow: 100 });
  });

  it('saves the whole look for a signed-in viewer, keeping the parts it did not change', async () => {
    const calls = mockApi(echoProfile);
    const choice = mountChoice({ signedIn: true });
    await choice.update({ accent: 'mint' });
    await choice.update({ glass: 40 });
    expect(patches(calls)).toEqual([
      { appearance: { accent: 'mint', glass: 0, glow: 100 } },
      { appearance: { accent: 'mint', glass: 40, glow: 100 } },
    ]);
  });

  it('paints on apply and sends only when told to save (slider drags do not flood the API)', async () => {
    const calls = mockApi(echoProfile);
    const choice = mountChoice({ signedIn: true });
    choice.apply({ glass: 30 });
    choice.apply({ glass: 31 });
    expect(root.style.getPropertyValue('--qh-glass-level')).toBe('31');
    expect(calls).toEqual([]);
    await choice.save();
    expect(patches(calls)).toEqual([{ appearance: { accent: 'clay', glass: 31, glow: 100 } }]);
  });

  it('turns the look off and saves null', async () => {
    const calls = mockApi(echoProfile);
    const choice = mountChoice({ signedIn: true });
    await choice.update({ accent: 'gold' });
    await choice.turnOff();
    expect(patches(calls).at(-1)).toEqual({ appearance: null });
    expect(root.dataset.accent).toBeUndefined();
  });

  it('resets the look and the mode together, in one request', async () => {
    localStorage.setItem('qhhoj.theme', 'glass-light');
    const calls = mockApi(echoProfile);
    const choice = mountChoice({ signedIn: true });
    await choice.update({ accent: 'gold' });
    await choice.reset();
    expect(patches(calls).at(-1)).toEqual({ appearance: null, siteTheme: 'auto' });
    expect(root.dataset.accent).toBeUndefined();
    expect(useThemeStore().preference).toBe('auto');
  });

  it('keeps the look in this browser when saving to the account fails', async () => {
    mockApi(failedSave);
    const choice = mountChoice({ signedIn: true });
    await choice.update({ accent: 'mint' });
    await flushPromises();
    expect(useAppearanceStore().look?.accent).toBe('mint');
    expect(root.dataset.accent).toBe('mint');
  });
});
