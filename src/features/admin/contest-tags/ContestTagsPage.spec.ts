import { flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { mountAndWaitFor } from '@/test/admin-contest-mount';
import { staffViewer } from '@/test/admin-routes';
import { contestTag } from '@/test/contest-extras-fixtures';
import { fail, mockApi, ok, page } from '@/test/mock-api';
import { adminContestItem } from '@/test/admin-fixtures/index-search';

const PERMISSION = ['judge.change_contest_tag'];
const TITLE = 'Thẻ hiện trên danh sách kỳ thi';

/** Drawers render into `<body>`, outside the mounted wrapper. */
const inBody = <T extends Element = HTMLElement>(selector: string) =>
  document.body.querySelector<T>(selector);
const settle = async () => {
  await flushPromises();
  await nextTick();
  await new Promise((resolve) => setTimeout(resolve, 50));
  await flushPromises();
};
const type = (selector: string, value: string) => {
  const input = inBody<HTMLInputElement>(selector)!;
  input.value = value;
  input.dispatchEvent(new Event('input'));
};
const submitEditor = async () => {
  inBody<HTMLFormElement>('[data-testid="tag-editor"] form')!.requestSubmit();
  await settle();
};

describe('contest tag catalogue screen', () => {
  it('refuses a malformed slug locally and shows the server refusal for a repeat', async () => {
    const calls = mockApi({
      ...staffViewer(PERMISSION),
      'GET /contest-tags': page([]),
      'POST /contest-tags': fail(409, 'conflict'),
    });
    const { wrapper } = await mountAndWaitFor('/admin/contest-tags', TITLE);
    await wrapper.get('[data-testid="tag-create"]').trigger('click');
    await settle();
    type('#contest-tag-slug', 'Quốc gia');
    type('#contest-tag-name', 'Quốc gia');
    await submitEditor();
    expect(calls.filter((call) => call.method === 'POST')).toHaveLength(0);
    expect(document.body.textContent).toContain('Chỉ chữ thường, số và dấu gạch ngang');
    type('#contest-tag-slug', 'quoc-gia');
    await submitEditor();
    expect(inBody('#contest-tag-slug')!.getAttribute('aria-invalid')).toBe('true');
    expect(document.body.textContent).toContain('Mã thẻ này đã có.');
    expect(document.body.textContent).not.toContain('Hãy tải lại và thử lại.');
  });

  it('blocks a new tag and says why when the catalogue holds 100 tags', async () => {
    const hundred = Array.from({ length: 100 }, (_unused, index) =>
      contestTag({ slug: `t${index}`, name: `T${index}` }),
    );
    mockApi({ ...staffViewer(PERMISSION), 'GET /contest-tags': page(hundred) });
    const { wrapper } = await mountAndWaitFor('/admin/contest-tags', TITLE);
    expect(wrapper.get('[data-testid="tag-catalogue-full"]').text()).toContain(
      'Danh mục đã đủ 100 thẻ',
    );
    const create = wrapper.get('[data-testid="tag-create"]');
    expect(create.attributes('aria-disabled')).toBe('true');
    await create.trigger('click');
    await settle();
    expect(inBody('[data-testid="tag-editor"]')).toBeNull();
  });

  it('shows the forbidden state to staff without the permission', async () => {
    mockApi({ ...staffViewer(['judge.add_contest']) });
    const { wrapper } = await mountAndWaitFor('/admin/contest-tags', 'Sửa thẻ kỳ thi');
    expect(wrapper.find('[data-testid="admin-forbidden"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="tag-create"]').exists()).toBe(false);
  });

  it('lists the tagged contests, tags more by key and removes the tag from ticked ones', async () => {
    const calls = mockApi({
      ...staffViewer(PERMISSION),
      'GET /contest-tags': page([contestTag({ slug: 'cup', name: 'Cup', contestCount: 1 })]),
      'GET /contests': page([adminContestItem({ key: 'cup-1', tags: ['cup'] })]),
      'POST /contests/bulk/tag': ok({ results: [], done: 0, failed: 0 }),
    });
    const { wrapper } = await mountAndWaitFor('/admin/contest-tags', TITLE);
    await wrapper.get('button[aria-label="Thao tác khác với thẻ Cup"]').trigger('click');
    await flushPromises();
    const assign = [...document.body.querySelectorAll('[role="menuitem"]')].find((item) =>
      item.textContent?.includes('Gắn kỳ thi'),
    );
    (assign!.querySelector('a') as HTMLElement).click();
    await settle();
    expect(calls.find((call) => call.path === '/contests')!.query.get('tag')).toBe('cup');
    type('#tag-contests-add', 'w41, w42 w41');
    inBody<HTMLInputElement>('#tag-contests-add')!.form!.requestSubmit();
    await settle();
    const box = inBody<HTMLInputElement>('li input[type="checkbox"]')!;
    box.checked = true;
    box.dispatchEvent(new Event('change'));
    await settle();
    [...document.body.querySelectorAll('button')]
      .find((button) => button.textContent?.trim().startsWith('Gỡ thẻ khỏi 1'))!
      .click();
    await settle();
    expect(calls.filter((call) => call.method === 'POST').map((call) => call.body)).toEqual([
      { keys: ['w41', 'w42'], assigned: true, tag: 'cup' },
      { keys: ['cup-1'], assigned: false, tag: 'cup' },
    ]);
  });
});
