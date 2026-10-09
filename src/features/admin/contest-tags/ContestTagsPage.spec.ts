import { flushPromises } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { mountAndWaitFor } from '@/test/admin-contest-mount';
import { cancelDialog, confirmDialog, staffViewer } from '@/test/admin-routes';
import { contestTag, TAG_CATALOGUE } from '@/test/contest-extras-fixtures';
import { fail, mockApi, noContent, ok, page, sequence } from '@/test/mock-api';

const PERMISSION = ['judge.change_contest_tag'];
const TITLE = 'Danh mục thẻ hiện trên danh sách kỳ thi';
type Mounted = Awaited<ReturnType<typeof mountAndWaitFor>>['wrapper'];
const buttonNamed = (wrapper: Mounted, text: string) =>
  wrapper.findAll('button').find((button) => button.text().replace(/\s+/g, ' ') === text)!;
const submit = (wrapper: Mounted) =>
  wrapper.get('[data-testid="tag-editor"] form').trigger('submit');

describe('contest tag catalogue screen', () => {
  it('lists the catalogue with each chip in its own colour', async () => {
    mockApi({ ...staffViewer(PERMISSION), 'GET /contest-tags': page(TAG_CATALOGUE) });
    const { wrapper } = await mountAndWaitFor('/admin/contest-tags', TITLE);
    const rows = wrapper.findAll('[data-testid="tag-row"]');
    expect(rows).toHaveLength(8);
    expect(rows[4]!.get('span').classes()).toContain('text-tag-5');
  });

  it('creates a tag with the picked colour, then reads the catalogue again', async () => {
    const olympic = contestTag({ slug: 'olp', name: 'Olympic', color: 'tag-6' });
    const calls = mockApi({
      ...staffViewer(PERMISSION),
      'GET /contest-tags': sequence(page([]), page([olympic])),
      'POST /contest-tags': ok(olympic),
    });
    const { wrapper } = await mountAndWaitFor('/admin/contest-tags', TITLE);
    await wrapper.get('#contest-tag-slug').setValue('olp');
    await wrapper.get('#contest-tag-name').setValue('Olympic');
    await wrapper.get('[data-color="tag-6"] input').setValue(true);
    await submit(wrapper);
    await flushPromises();
    const posts = calls.filter((call) => call.method === 'POST');
    expect(posts.map((call) => call.body)).toEqual([
      { slug: 'olp', name: 'Olympic', color: 'tag-6', description: '', order: 0 },
    ]);
    expect(
      calls.filter((call) => call.path === '/contest-tags' && call.method === 'GET'),
    ).toHaveLength(2);
    expect(wrapper.text()).toContain('Đã thêm thẻ.');
  });

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
    expect(wrapper.find('[role="alert"]').exists()).toBe(true);
  });

  it('edits only the changed fields of an existing tag, slug read-only', async () => {
    const calls = mockApi({
      ...staffViewer(PERMISSION),
      'GET /contest-tags': page([contestTag()]),
      'PATCH /contest-tags/quoc-gia': ok(contestTag({ color: 'tag-2' })),
    });
    const { wrapper } = await mountAndWaitFor('/admin/contest-tags', TITLE);
    await vi.waitFor(() => expect(wrapper.find('[data-testid="tag-row"]').exists()).toBe(true));
    await buttonNamed(wrapper, 'Sửa Quốc gia').trigger('click');
    expect(wrapper.get('#contest-tag-slug').attributes('readonly')).toBeDefined();
    await wrapper.get('[data-color="tag-2"] input').setValue(true);
    await submit(wrapper);
    await flushPromises();
    expect(calls.filter((call) => call.method === 'PATCH').map((call) => call.body)).toEqual([
      { color: 'tag-2' },
    ]);
  });

  it('deletes only after the confirm, and Cancel sends nothing', async () => {
    const calls = mockApi({
      ...staffViewer(PERMISSION),
      'GET /contest-tags': page([contestTag()]),
      'DELETE /contest-tags/quoc-gia': noContent(),
    });
    const { wrapper } = await mountAndWaitFor('/admin/contest-tags', TITLE);
    await vi.waitFor(() => expect(wrapper.find('[data-testid="tag-row"]').exists()).toBe(true));
    await buttonNamed(wrapper, 'Xóa Quốc gia').trigger('click');
    await flushPromises();
    await cancelDialog();
    expect(calls.filter((call) => call.method === 'DELETE')).toHaveLength(0);
    await buttonNamed(wrapper, 'Xóa Quốc gia').trigger('click');
    await flushPromises();
    await confirmDialog('Xóa thẻ');
    expect(calls.filter((call) => call.method === 'DELETE')).toHaveLength(1);
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
