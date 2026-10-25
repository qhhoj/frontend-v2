import { describe, expect, it } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { contestViewer } from '@/test/fixtures';
import { mockApi, ok } from '@/test/mock-api';
import { staffViewer } from '@/test/admin-routes';
import { contestEditorRoutes, editableContest } from '@/test/admin-fixtures/contests';
import { mountAndWaitFor } from '@/test/admin-contest-mount';

const EDIT = ['judge.edit_own_contest'];

describe('ContestEditorPage', () => {
  it('refuses a contest the account cannot edit, with Bit', async () => {
    mockApi({
      ...staffViewer(EDIT),
      ...contestEditorRoutes(
        editableContest({
          settings: null,
          viewer: contestViewer(),
        }),
      ),
    });
    const { wrapper } = await mountAndWaitFor(
      '/admin/contests/hcmus-w41/general',
      'Tài khoản này không sửa được',
    );
    expect(wrapper.text()).toContain('Tài khoản này không sửa được kỳ thi hcmus-w41.');
    expect(wrapper.find('[data-placement="forbidden"]').exists()).toBe(true);
  });

  it('asks before another contest replaces a dirty General form, and then shows that contest', async () => {
    const contestA = editableContest({ key: 'contest_a', name: 'Contest A' });
    const contestB = editableContest({ key: 'contest_b', name: 'Contest B' });
    const calls = mockApi({
      ...staffViewer(EDIT),
      ...contestEditorRoutes(contestA),
      ...contestEditorRoutes(contestB),
      'PATCH /contests/contest_b': ok(contestB),
    });
    const { wrapper, router } = await mountAndWaitFor(
      '/admin/contests/contest_a/general',
      'Cách tính điểm',
    );
    await wrapper.get('#contest-name').setValue('Contest A (renamed)');
    await router.push({ name: 'admin-contestGeneral', params: { key: 'contest_b' } });
    await flushPromises();
    expect(router.currentRoute.value.params.key).toBe('contest_a');
    expect(document.body.textContent).toContain('Rời trang?');

    [...document.body.querySelectorAll('button')]
      .find((button) => button.textContent?.trim() === 'Rời trang')!
      .click();
    await flushPromises();
    expect(router.currentRoute.value.params.key).toBe('contest_b');
    expect((wrapper.get('#contest-name').element as HTMLInputElement).value).toBe('Contest B');
    expect(calls.some((call) => call.method === 'PATCH')).toBe(false);
  });
});
