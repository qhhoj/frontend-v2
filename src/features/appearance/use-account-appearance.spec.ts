import { flushPromises } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent } from 'vue';
import { useSessionStore } from '@/stores/session.store';
import { profile, signedIn, signedOut } from '@/test/fixtures';
import { mockApi, ok } from '@/test/mock-api';
import { mountApp, mountComponent } from '@/test/mount';
import { useAccountAppearanceSync } from './use-account-appearance';
import { useAppearanceChoice } from './use-appearance-choice';

const OCEAN = { accent: 'ocean', glass: 40, glow: 60 };
const MINT = { accent: 'mint', glass: 10, glow: 20 };
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
  it("paints the account's look once the profile is loaded", async () => {
    mockApi({ 'GET /auth/me': signedIn(), 'GET /profile': ok(profile({ appearance: OCEAN })) });
    await mountApp('/blog');
    expect(root.dataset.accent).toBe('ocean');
    expect(root.style.getPropertyValue('--qh-glass-level')).toBe('40');
    expect(root.style.getPropertyValue('--qh-blob-strength')).toBe('0.6');
  });

  it("lets the account outrank this browser, and null mean the site's own look", async () => {
    localStorage.setItem('qhhoj.appearance', JSON.stringify(MINT));
    localStorage.setItem('qhhoj.paintedAppearance', JSON.stringify(MINT));
    mockApi({ 'GET /auth/me': signedIn(), 'GET /profile': ok(profile({ appearance: null })) });
    await mountApp('/blog');
    expect(root.dataset.accent).toBeUndefined();
  });

  it('keeps the pre-painted look while the profile fails to load', async () => {
    localStorage.setItem('qhhoj.paintedAppearance', JSON.stringify(OCEAN));
    mockApi({ 'GET /auth/me': signedIn(), 'GET /profile': failedProfile });
    await mountApp('/blog');
    expect(root.dataset.accent).toBe('ocean');
  });

  it('reads an invalid account value as the site look', async () => {
    mockApi({
      'GET /auth/me': signedIn(),
      'GET /profile': ok(profile({ appearance: { accent: 'violet', glass: 1, glow: 1 } })),
    });
    await mountApp('/blog');
    expect(root.dataset.accent).toBeUndefined();
  });

  it("uses this browser's look for an anonymous visitor", async () => {
    localStorage.setItem('qhhoj.appearance', JSON.stringify(MINT));
    mockApi({ 'GET /auth/me': signedOut });
    await mountApp('/blog');
    expect(root.dataset.accent).toBe('mint');
  });

  it("uses this browser's look while a password change blocks the profile, not the painted account look", async () => {
    localStorage.setItem('qhhoj.appearance', JSON.stringify(MINT));
    localStorage.setItem('qhhoj.paintedAppearance', JSON.stringify(OCEAN));
    mockApi({ 'GET /auth/me': signedIn({ passwordChangeRequired: true }) });
    await mountApp('/blog');
    expect(root.dataset.accent).toBe('mint');
  });

  it("hands back to this browser's look on sign-out", async () => {
    localStorage.setItem('qhhoj.appearance', JSON.stringify(MINT));
    mockApi({ 'GET /auth/me': signedIn(), 'GET /profile': ok(profile({ appearance: OCEAN })) });
    await mountApp('/blog');
    expect(root.dataset.accent).toBe('ocean');
    useSessionStore().$patch({ status: 'anonymous', user: null }); // what a 401 on any request does
    await flushPromises();
    expect(root.dataset.accent).toBe('mint');
  });

  it('does not snap the controls back to a save answer after the user painted another look', async () => {
    mockApi({ 'GET /auth/me': signedIn(), 'GET /profile': ok(profile()) });
    const answers = holdProfileSaves();
    const choice = mountSyncedChoice();
    await flushPromises();
    const saved = choice.update({ accent: 'mint' }); // the answer will carry the look sent: mint, glass 0, glow 100
    await flushPromises();
    choice.apply({ glass: 30 }); // painted, not saved, while the answer is on its way
    answers[0]!(profile({ appearance: { accent: 'mint', glass: 0, glow: 100 } }));
    await saved;
    await flushPromises();
    expect(root.dataset.accent).toBe('mint');
    expect(root.style.getPropertyValue('--qh-glass-level')).toBe('30');
  });

  it("keeps the newest choice when an older save's answer arrives", async () => {
    mockApi({ 'GET /auth/me': signedIn(), 'GET /profile': ok(profile()) });
    const answers = holdProfileSaves();
    const choice = mountSyncedChoice();
    await flushPromises();
    const first = choice.update({ accent: 'mint' });
    await flushPromises();
    const second = choice.update({ accent: 'ocean' });
    await flushPromises();
    answers[0]!(profile({ appearance: { accent: 'mint', glass: 0, glow: 100 } }));
    await first;
    await flushPromises();
    expect(root.dataset.accent).toBe('ocean');
    answers[1]!(profile({ appearance: { accent: 'ocean', glass: 0, glow: 100 } }));
    await second;
    await flushPromises();
    expect(root.dataset.accent).toBe('ocean');
  });
});
