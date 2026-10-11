import { describe, expect, it } from 'vitest';
import { contestViewer } from '@/test/fixtures';
import { mockApi } from '@/test/mock-api';
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
});
