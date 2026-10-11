import { flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { mountAndWaitFor } from '@/test/admin-contest-mount';
import { staffViewer } from '@/test/admin-routes';
import { contestTag } from '@/test/contest-extras-fixtures';
import { fail, mockApi, page } from '@/test/mock-api';

const PERMISSION = ['judge.change_contest_tag'];
const TITLE = 'Danh mục thẻ hiện trên danh sách kỳ thi';
type Mounted = Awaited<ReturnType<typeof mountAndWaitFor>>['wrapper'];
const submit = (wrapper: Mounted) =>
  wrapper.get('[data-testid="tag-editor"] form').trigger('submit');

describe('contest tag catalogue screen', () => {
  it('refuses a malformed slug locally and shows the server refusal for a repeat', async () => {
    const calls = mockApi({
      ...staffViewer(PERMISSION),
      'GET /contest-tags': page([]),
      'POST /contest-tags': fail(409, 'conflict'),
    });
    const { wrapper } = await mountAndWaitFor('/admin/contest-tags', TITLE);
    await wrapper.get('#contest-tag-slug').setValue('Quốc gia');
    await wrapper.get('#contest-tag-name').setValue('Quốc gia');
    await submit(wrapper);
    expect(calls.filter((call) => call.method === 'POST')).toHaveLength(0);
    expect(wrapper.text()).toContain('Chỉ chữ thường, số và dấu gạch ngang');
    await wrapper.get('#contest-tag-slug').setValue('quoc-gia');
    await submit(wrapper);
    await flushPromises();
    expect(wrapper.get('#contest-tag-slug').attributes('aria-invalid')).toBe('true');
    expect(wrapper.text()).toContain('Mã thẻ này đã có.');
    expect(wrapper.text()).not.toContain('Hãy tải lại và thử lại.');
  });

  it('turns the create form into a notice when the catalogue holds 100 tags', async () => {
    const hundred = Array.from({ length: 100 }, (_unused, index) =>
      contestTag({ slug: `t${index}`, name: `T${index}` }),
    );
    mockApi({ ...staffViewer(PERMISSION), 'GET /contest-tags': page(hundred) });
    const { wrapper } = await mountAndWaitFor('/admin/contest-tags', TITLE);
    expect(wrapper.get('[data-testid="tag-editor"]').text()).toContain('Danh mục đã đủ 100 thẻ');
    expect(wrapper.find('[data-testid="tag-editor"] form').exists()).toBe(false);
  });

  it('shows the forbidden state to staff without the permission', async () => {
    mockApi({ ...staffViewer(['judge.add_contest']) });
    const { wrapper } = await mountAndWaitFor('/admin/contest-tags', 'judge.change_contest_tag');
    expect(wrapper.find('[data-testid="admin-forbidden"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="tag-editor"]').exists()).toBe(false);
  });
});
