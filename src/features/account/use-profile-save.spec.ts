import { useQueryClient } from '@tanstack/vue-query';
import { flushPromises } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import { describe, expect, it, vi } from 'vitest';
import type { Profile, ProfilePatch } from '@/api/types/profile';
import { useThemeChoice } from '@/features/shell/use-theme-choice';
import { useSessionStore } from '@/stores/session.store';
import { profile, sessionUser, signedOut } from '@/test/fixtures';
import { fail, mockApi, ok, sequence } from '@/test/mock-api';
import { mountComponent } from '@/test/mount';
import { profileKey } from './profile.queries';
import { useProfileSave, useProfileUpdate } from './use-profile-save';

const OCEAN = { accent: 'ocean', glass: 40, glow: 60 } as const;

function mountSavers({ signedIn = true } = {}) {
  const wrapper = mountComponent(
    defineComponent({
      setup: () => ({
        saveProfile: useProfileSave(),
        chooseTheme: useThemeChoice(),
        update: useProfileUpdate(),
        queryClient: useQueryClient(),
      }),
      render: () => h('div'),
    }),
  );
  if (signedIn) useSessionStore().$patch({ status: 'authenticated', user: sessionUser() });
  return wrapper.vm as unknown as {
    saveProfile: (patch: ProfilePatch) => Promise<void>;
    chooseTheme: (preference: string) => Promise<void>;
    update: (patch: ProfilePatch) => Promise<Profile>;
    queryClient: ReturnType<typeof useQueryClient>;
  };
}

/** `PATCH /profile` answers held until the test releases them, in any order. */
function holdPatches() {
  const pending: Array<(data: unknown) => void> = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(
      () =>
        new Promise<Response>((resolve) =>
          pending.push((data) =>
            resolve(
              new Response(JSON.stringify({ data }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
              }),
            ),
          ),
        ),
    ),
  );
  return pending;
}

describe('profile save', () => {
  it('sends nothing for an anonymous visitor', async () => {
    const calls = mockApi({ 'GET /auth/me': signedOut });
    const { saveProfile } = mountSavers({ signedIn: false });
    await saveProfile({ siteTheme: 'clay-dark' });
    expect(calls.filter((call) => call.method === 'PATCH')).toEqual([]);
  });

  it('puts the answer in the profile cache', async () => {
    mockApi({ 'PATCH /profile': ({ body }) => ok(profile(body as object)) });
    const { saveProfile, queryClient } = mountSavers();
    await saveProfile({ siteTheme: 'clay-dark' });
    expect(queryClient.getQueryData(profileKey(sessionUser().id))).toEqual(
      profile({ siteTheme: 'clay-dark' }),
    );
  });

  it('never lets an older answer overwrite a newer one, whichever saver sent it', async () => {
    const answers = holdPatches();
    const { saveProfile, chooseTheme, queryClient } = mountSavers();
    const themeSave = chooseTheme('glass-dark');
    const lookSave = saveProfile({ appearance: OCEAN });
    await flushPromises(); // both requests are on the wire
    expect(answers).toHaveLength(2);
    answers[1]!(profile({ siteTheme: 'glass-dark', appearance: OCEAN }));
    await lookSave;
    // The theme answer arrives last, carrying the look as it was before: it must not undo the newer look.
    answers[0]!(profile({ siteTheme: 'glass-dark', appearance: null }));
    await themeSave;
    expect(queryClient.getQueryData(profileKey(sessionUser().id))).toEqual(
      profile({ siteTheme: 'glass-dark', appearance: OCEAN }),
    );
  });

  it('sends nothing while a password change is required', async () => {
    const calls = mockApi({ 'PATCH /profile': ok(profile()) });
    const { saveProfile } = mountSavers();
    useSessionStore().$patch({ passwordChangeRequired: true });
    await saveProfile({ siteTheme: 'clay-dark' });
    expect(calls.filter((call) => call.method === 'PATCH')).toEqual([]);
  });

  it('drops an answer that arrives after sign-out', async () => {
    const answers = holdPatches();
    const { saveProfile, queryClient } = mountSavers();
    const save = saveProfile({ siteTheme: 'glass-dark' });
    await flushPromises();
    useSessionStore().$patch({ status: 'anonymous', user: null });
    answers[0]!(profile({ siteTheme: 'glass-dark' }));
    await save;
    expect(queryClient.getQueryData(profileKey(sessionUser().id))).toBeUndefined();
  });

  it('drops an answer that arrives after the signed-in account changed', async () => {
    const answers = holdPatches();
    const { saveProfile, queryClient } = mountSavers();
    const save = saveProfile({ siteTheme: 'glass-dark' });
    await flushPromises();
    const otherId = '0192a000-0000-7000-8000-00000000000b';
    useSessionStore().$patch({ user: sessionUser({ id: otherId }) });
    answers[0]!(profile({ siteTheme: 'glass-dark' }));
    await save;
    expect(queryClient.getQueryData(profileKey(otherId))).toBeUndefined();
    expect(queryClient.getQueryData(profileKey(sessionUser().id))).toBeUndefined();
  });

  it('swallows a failed save and leaves the cache alone', async () => {
    mockApi({
      'PATCH /profile': { status: 500, body: { error: { code: 'internal_error', message: 'x' } } },
    });
    const { saveProfile, queryClient } = mountSavers();
    await expect(saveProfile({ siteTheme: 'clay-dark' })).resolves.toBeUndefined();
    expect(queryClient.getQueryData(profileKey(sessionUser().id))).toBeUndefined();
  });
});

describe('useProfileUpdate', () => {
  it('returns the stored profile and caches it', async () => {
    mockApi({ 'PATCH /profile': ok(profile({ firstName: 'Thư' })) });
    const { update, queryClient } = mountSavers();
    await expect(update({ firstName: 'Thư' })).resolves.toMatchObject({ firstName: 'Thư' });
    expect(queryClient.getQueryData(profileKey(sessionUser().id))).toMatchObject({
      firstName: 'Thư',
    });
  });

  it('rethrows a failure, unlike the theme saver', async () => {
    mockApi({ 'PATCH /profile': fail(400, 'validation_failed') });
    const { update } = mountSavers();
    await expect(update({ timezone: 'Mars/Base' })).rejects.toMatchObject({
      code: 'validation_failed',
    });
  });

  it('shares one sequence with the theme saver: its answer is dropped once a newer save started', async () => {
    mockApi({
      'PATCH /profile': sequence(ok(profile({ firstName: 'Thư' })), fail(500, 'http_error')),
    });
    const { update, saveProfile, queryClient } = mountSavers();
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    await Promise.all([update({ firstName: 'Thư' }), saveProfile({ siteTheme: 'clay-dark' })]);
    // The older answer was dropped and the newer save failed: the cache must be refetched, not kept stale.
    expect(invalidate).toHaveBeenCalledWith({ queryKey: profileKey(sessionUser().id) });
  });
});
