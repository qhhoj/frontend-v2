import { describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { fail, mockApi } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { staffViewer } from '@/test/admin-routes';
import { problemEditorRoutes } from '@/test/admin-fixtures/problems';

const QUOTA = fail(403, 'quota_exceeded', undefined, undefined, {
  details: { meter: 'credits', limit: 200, used: 194, needed: 10 },
});
const CREDITS_TEXT = 'cần 10, còn lại 6 (đã dùng 194 / 200)';

describe('quota refusals on admin forms', () => {
  it('the problem clone card shows the refusal it used to drop', async () => {
    mockApi({
      ...staffViewer(['judge.edit_own_problem', 'judge.clone_problem']),
      ...problemEditorRoutes(),
      'POST /problems/hcmus41c/clone': QUOTA,
    });
    const { wrapper } = await mountApp('/admin/problems/hcmus41c/general');
    await vi.waitFor(() => expect(wrapper.find('#problem-clone-code').exists()).toBe(true), {
      timeout: 5000,
    });
    await wrapper.get('#problem-clone-code').setValue('hcmus41c_ban_sao');
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Nhân bản')!
      .trigger('click');
    await flushPromises();
    expect(wrapper.get('[role="alert"]').text()).toContain(CREDITS_TEXT);
  });
});
