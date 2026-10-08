import { flushPromises } from '@vue/test-utils';
import { defineComponent } from 'vue';
import { describe, expect, it } from 'vitest';
import { ApiError } from '@/api/client';
import { useSessionStore } from '@/stores/session.store';
import { profile, profileOrganization, signedIn } from '@/test/fixtures';
import { fail, invalid, issue, mockApi, ok, sequence } from '@/test/mock-api';
import type { ApiCall, MockHandler } from '@/test/mock-api';
import { mountComponent } from '@/test/mount';
import { saveErrorText } from './profile-errors';
import { useProfileDraft } from './use-profile-draft';

const LHP = profileOrganization();
const HCM = profileOrganization({
  id: '0192a000-0000-7000-8000-0000000001a2',
  name: 'Đội tuyển Tin học TP.HCM',
});

async function mountDraft(routes: Record<string, MockHandler>) {
  const calls = mockApi({ 'GET /auth/me': signedIn(), ...routes });
  let form!: ReturnType<typeof useProfileDraft>;
  mountComponent(
    defineComponent({
      setup() {
        form = useProfileDraft();
        return () => null;
      },
    }),
  );
  await useSessionStore().ensureLoaded();
  await flushPromises();
  return { form, calls };
}
const patches = (calls: ApiCall[]) =>
  calls.filter((call) => call.method === 'PATCH').map((call) => call.body);
/** The backend answers the stored profile: Thư plus whatever was sent. */
const echo: MockHandler = ({ body }) => ok(profile({ firstName: 'Thư', ...(body as object) }));

describe('useProfileDraft', () => {
  it('starts clean from the profile', async () => {
    const { form } = await mountDraft({
      'GET /profile': ok(profile({ firstName: 'Thư', organizations: [LHP, HCM] })),
    });
    expect(form.draft.value).toMatchObject({ firstName: 'Thư', organizationIds: [LHP.id, HCM.id] });
    expect(form.dirty.value).toBe(false);
  });

  it('sends only the changed keys, then is clean and says saved until the next edit', async () => {
    const { form, calls } = await mountDraft({
      'GET /profile': ok(profile({ firstName: 'Thư' })),
      'PATCH /profile': echo,
    });
    form.draft.value!.about = 'Học sinh lớp 11';
    expect(form.dirty.value).toBe(true);
    await expect(form.save()).resolves.toBe(true);
    expect(patches(calls)).toEqual([{ about: 'Học sinh lớp 11' }]);
    expect(form.dirty.value).toBe(false);
    expect(form.justSaved.value).toBe(true);
    form.draft.value!.about = 'Học sinh lớp 12';
    expect(form.justSaved.value).toBe(false);
  });

  it('is clean after the backend trims the name it stored', async () => {
    const { form } = await mountDraft({
      'GET /profile': ok(profile({ firstName: 'Thư' })),
      'PATCH /profile': ok(profile({ firstName: 'Minh Thư' })),
    });
    form.draft.value!.firstName = 'Minh Thư  ';
    await form.save();
    expect(form.draft.value!.firstName).toBe('Minh Thư');
    expect(form.dirty.value).toBe(false);
  });

  it('keeps, and still counts as unsaved, what was typed while the save was in flight', async () => {
    const { form } = await mountDraft({
      'GET /profile': ok(profile({ firstName: 'Thư' })),
      'PATCH /profile': echo,
    });
    form.draft.value!.about = 'A';
    const saving = form.save();
    form.draft.value!.about = 'AB';
    await saving;
    expect(form.draft.value!.about).toBe('AB');
    expect(form.dirty.value).toBe(true);
  });

  it('never lets a refetch replace what the viewer is typing', async () => {
    const { form } = await mountDraft({
      'GET /profile': sequence(
        ok(profile({ firstName: 'Thư' })),
        ok(profile({ firstName: 'Khác' })),
      ),
    });
    form.draft.value!.firstName = 'Minh Thư';
    await form.query.refetch();
    await flushPromises();
    expect(form.draft.value!.firstName).toBe('Minh Thư');
  });

  it('sends nothing while a text is over its limit, and says which', async () => {
    const { form, calls } = await mountDraft({ 'GET /profile': ok(profile()) });
    form.draft.value!.firstName = 'x'.repeat(31);
    await expect(form.save()).resolves.toBe(false);
    expect(patches(calls)).toEqual([]);
    expect(form.problems.value).toEqual([{ field: 'firstName', used: 31, max: 30 }]);
    expect(form.attempted.value).toBe(true);
  });

  it('keeps every change when the save fails', async () => {
    const { form } = await mountDraft({
      'GET /profile': ok(profile({ firstName: 'Thư' })),
      'PATCH /profile': invalid(
        issue('timezone', 'is_time_zone', 'timezone must be a valid IANA timezone'),
      ),
    });
    form.draft.value!.firstName = 'Minh Thư';
    form.draft.value!.timezone = 'Mars/Base';
    await expect(form.save()).resolves.toBe(false);
    expect(form.draft.value).toMatchObject({ firstName: 'Minh Thư', timezone: 'Mars/Base' });
    expect(form.error.value).toBeInstanceOf(ApiError);
  });

  it('reloads the organizations after a conflict and keeps the other edits', async () => {
    const { form } = await mountDraft({
      'GET /profile': sequence(
        ok(profile({ firstName: 'Thư', organizations: [LHP, HCM] })),
        ok(profile({ firstName: 'Thư', organizations: [HCM] })),
      ),
      'PATCH /profile': fail(409, 'conflict'),
    });
    form.draft.value!.firstName = 'Minh Thư';
    form.draft.value!.organizationIds = [HCM.id, LHP.id];
    await form.save();
    expect(form.draft.value).toMatchObject({
      firstName: 'Minh Thư',
      organizationIds: [HCM.id, LHP.id],
    });
    expect(form.saved.value!.organizationIds).toEqual([HCM.id]);
    expect(form.dirty.value).toBe(true);
  });

  it('after an admin cannot leave, keeps the selection, names both causes and lets the viewer retry', async () => {
    const { form, calls } = await mountDraft({
      'GET /profile': ok(profile({ firstName: 'Thư', organizations: [LHP, HCM] })),
      'PATCH /profile': sequence(
        fail(409, 'conflict'),
        ok(profile({ firstName: 'Thư', organizations: [HCM] })),
      ),
    });
    form.draft.value!.organizationIds = [HCM.id];
    await expect(form.save()).resolves.toBe(false);
    expect(form.draft.value!.organizationIds).toEqual([HCM.id]);
    expect(form.saved.value!.organizationIds).toEqual([LHP.id, HCM.id]);
    expect(saveErrorText(form.error.value)).toMatch(/quản trị viên/);
    expect(saveErrorText(form.error.value)).toMatch(/vừa thay đổi/);
    await expect(form.save()).resolves.toBe(true);
    expect(patches(calls)).toEqual([{ organizations: [HCM.id] }, { organizations: [HCM.id] }]);
  });

  it('undo returns to the last saved values and clears the failure', async () => {
    const { form } = await mountDraft({
      'GET /profile': ok(profile({ firstName: 'Thư' })),
      'PATCH /profile': fail(500, 'http_error'),
    });
    form.draft.value!.firstName = 'Minh Thư';
    await form.save();
    form.undo();
    expect(form.draft.value!.firstName).toBe('Thư');
    expect(form.error.value).toBeNull();
    expect(form.dirty.value).toBe(false);
  });
});
