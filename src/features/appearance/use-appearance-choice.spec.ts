import { flushPromises } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import { describe, expect, it } from 'vitest';
import { useSessionStore } from '@/stores/session.store';
import { useAppearanceStore } from '@/theme/appearance.store';
import { useThemeStore } from '@/theme/theme.store';
import { profile, sessionUser } from '@/test/fixtures';
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
  it('saves the whole look for a signed-in viewer, keeping the parts it did not change', async () => {
    const calls = mockApi(echoProfile);
    const choice = mountChoice({ signedIn: true });
    await choice.update({ accent: 'teal' });
    await choice.update({ contrast: 'high' });
    expect(patches(calls)).toEqual([
      { appearance: { accent: 'teal' } },
      { appearance: { accent: 'teal', contrast: 'high' } },
    ]);
  });

  it('resets the look and the mode together, in one request', async () => {
    localStorage.setItem('qhhoj.theme', 'light');
    const calls = mockApi(echoProfile);
    const choice = mountChoice({ signedIn: true });
    await choice.update({ accent: 'plum' });
    await choice.reset();
    expect(patches(calls).at(-1)).toEqual({ appearance: null, siteTheme: 'auto' });
    expect(root.dataset.accent).toBeUndefined();
    expect(useThemeStore().preference).toBe('auto');
  });

  it('keeps the look in this browser when saving to the account fails', async () => {
    mockApi(failedSave);
    const choice = mountChoice({ signedIn: true });
    await choice.update({ accent: 'teal' });
    await flushPromises();
    expect(useAppearanceStore().look?.accent).toBe('teal');
    expect(root.dataset.accent).toBe('teal');
  });
});
