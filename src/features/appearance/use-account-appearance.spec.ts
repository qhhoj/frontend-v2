import { flushPromises } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent } from 'vue';
import { profile, signedIn } from '@/test/fixtures';
import { mockApi, ok } from '@/test/mock-api';
import { blogListRoutes } from '@/test/community-routes';
import { mountApp, mountComponent } from '@/test/mount';
import { useAccountAppearanceSync } from './use-account-appearance';
import { useAppearanceChoice } from './use-appearance-choice';

const PLUM = { accent: 'plum', contrast: 'high', background: 'none' };
const TEAL = { accent: 'teal', contrast: 'standard', background: 'grainy' };
const root = document.documentElement;
const failedProfile = { status: 500, body: { error: { code: 'internal_error', message: 'x' } } };

/** Holds `PATCH /profile` answers until the test releases them; every other call goes to the routes mocked before. */
function holdProfileSaves() {
  const answers: Array<(data: unknown) => void> = [];
  const answer = globalThis.fetch;
  vi.stubGlobal('fetch', (input: string, init?: RequestInit) => {
    if (init?.method !== 'PATCH') return answer(input, init);
    return new Promise<Response>((resolve) =>
      answers.push((data) =>
        resolve(
          new Response(JSON.stringify({ data }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        ),
      ),
    );
  });
  return answers;
}

/** Mounts the shell's sync and a look choice together, as the app does, and returns the choice. */
function mountSyncedChoice() {
  let choice!: ReturnType<typeof useAppearanceChoice>;
  mountComponent(
    defineComponent({
      setup() {
        useAccountAppearanceSync();
        choice = useAppearanceChoice();
        return () => null;
      },
    }),
  );
  return choice;
}

describe('account appearance sync', () => {
  it("lets the account outrank this browser, and null mean the site's own look", async () => {
    localStorage.setItem('qhhoj.appearance', JSON.stringify(TEAL));
    localStorage.setItem('qhhoj.paintedAppearance', JSON.stringify(TEAL));
    mockApi({
      ...blogListRoutes,
      'GET /auth/me': signedIn(),
      'GET /profile': ok(profile({ appearance: null })),
    });
    await mountApp('/blog');
    expect(root.dataset.accent).toBeUndefined();
  });

  it('keeps the pre-painted look while the profile fails to load', async () => {
    localStorage.setItem('qhhoj.paintedAppearance', JSON.stringify(PLUM));
    mockApi({ ...blogListRoutes, 'GET /auth/me': signedIn(), 'GET /profile': failedProfile });
    await mountApp('/blog');
    expect(root.dataset.accent).toBe('plum');
  });

  it("uses this browser's look while a password change blocks the profile, not the painted account look", async () => {
    localStorage.setItem('qhhoj.appearance', JSON.stringify(TEAL));
    localStorage.setItem('qhhoj.paintedAppearance', JSON.stringify(PLUM));
    mockApi({ ...blogListRoutes, 'GET /auth/me': signedIn({ passwordChangeRequired: true }) });
    await mountApp('/blog');
    expect(root.dataset.accent).toBe('teal');
  });

  it("keeps the newest choice when an older save's answer arrives", async () => {
    mockApi({ ...blogListRoutes, 'GET /auth/me': signedIn(), 'GET /profile': ok(profile()) });
    const answers = holdProfileSaves();
    const choice = mountSyncedChoice();
    await flushPromises();
    const first = choice.update({ accent: 'teal' });
    await flushPromises();
    const second = choice.update({ accent: 'plum' });
    await flushPromises();
    answers[0]!(profile({ appearance: { accent: 'teal' } }));
    await first;
    await flushPromises();
    expect(root.dataset.accent).toBe('plum');
    answers[1]!(profile({ appearance: { accent: 'plum' } }));
    await second;
    await flushPromises();
    expect(root.dataset.accent).toBe('plum');
  });
});
