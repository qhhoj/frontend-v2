import { flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { mockApi } from '@/test/mock-api';
import { staffViewer } from '@/test/admin-routes';
import { contestEditorRoutes, editableContest } from '@/test/admin-fixtures/contests';
import { mountAndWaitFor } from '@/test/admin-contest-mount';

const EDIT = ['judge.edit_own_contest'];

describe('ContestEditorPage', () => {
  it('shows the key, the name, the format line, six tabs in order and a link to the contest', async () => {
    mockApi({ ...staffViewer(EDIT), ...contestEditorRoutes() });
    const { wrapper } = await mountAndWaitFor('/admin/contests/hcmus-w41/general', 'ICPC · ');
    expect(wrapper.find('h1').text()).toBe('Chọn đội tuyển HCMUS · Tuần 41');
    expect(wrapper.text()).toContain('ICPC · ');
    expect(wrapper.text()).toContain('214 thí sinh');
    const tabs = '[aria-label="Các phần của kỳ thi"]';
    expect(wrapper.findAll(`${tabs} a`).map((tab) => tab.attributes('href'))).toEqual(
      ['general', 'problems', 'announcements', 'ranking', 'actions', 'participants'].map(
        (tab) => `/admin/contests/hcmus-w41/${tab}`,
      ),
    );
    expect(wrapper.find(`${tabs} [aria-current="page"]`).attributes('href')).toBe(
      '/admin/contests/hcmus-w41/general',
    );
    expect(wrapper.find('a[href="/contests/hcmus-w41"]').text()).toBe('Xem kỳ thi');
  });

  it('refuses a contest the account cannot edit, with Bit', async () => {
    mockApi({
      ...staffViewer(EDIT),
      ...contestEditorRoutes(
        editableContest({
          settings: null,
          viewer: { canEdit: false, isEditor: false, isTester: false, inContest: false },
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

  it('opens a contest typed into the index lookup', async () => {
    mockApi({
      'GET /contests': { body: { data: [], meta: { page: 1, pageSize: 20, total: 0 } } },
      ...staffViewer(['judge.add_contest', ...EDIT]),
      ...contestEditorRoutes(),
    });
    const { wrapper, router } = await mountAndWaitFor('/admin/contests', 'Khóa kỳ thi');
    await wrapper.get('input').setValue('hcmus-w41');
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    expect(router.currentRoute.value.fullPath).toBe('/admin/contests/hcmus-w41/general');
  });
});
