import { describe, expect, it } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { organizationDetail } from '@/test/community-fixtures';
import { organizationRoutes } from '@/test/community-routes';
import { mockApi, ok, page } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { signedInViewer } from '@/test/problem-routes';

const ADMIN = {
  isMember: true,
  canAdminister: true,
  canCreateProblem: false,
  canCreateContest: false,
  pendingRequestId: null,
};

async function openManage() {
  mockApi({
    ...signedInViewer(),
    ...organizationRoutes(organizationDetail({ viewer: ADMIN })),
    'GET /organizations/lhp/revisions': page([]),
    'POST /organizations/render-preview': ok({ html: '' }),
  });
  const { wrapper } = await mountApp('/organizations/lhp/manage');
  await flushPromises();
  return wrapper;
}

describe('organization settings form', () => {
  it('keeps Lưu thay đổi aria-disabled until the form is dirty, and Huỷ thay đổi puts it back', async () => {
    const wrapper = await openManage();
    const form = wrapper.get('form');
    const save = () => form.get('button[type="submit"]');
    expect(save().attributes('aria-disabled')).toBe('true');
    await form.get('#org-info-name').setValue('Tên mới');
    expect(save().attributes('aria-disabled')).toBeUndefined();
    const cancel = form.findAll('button').find((button) => button.text() === 'Huỷ thay đổi')!;
    await cancel.trigger('click');
    expect((form.get('#org-info-name').element as HTMLInputElement).value).not.toBe('Tên mới');
    expect(save().attributes('aria-disabled')).toBe('true');
  });

  it('opens and closes from its summary, but stays open while an edit is unsaved', async () => {
    const wrapper = await openManage();
    const fold = () => wrapper.get('[data-testid="org-info"]');
    const toggle = () => fold().get('summary').trigger('click');
    expect(fold().attributes('open')).toBeUndefined();
    await toggle();
    expect(fold().attributes('open')).toBeDefined();
    await wrapper.get('#org-info-name').setValue('Tên mới');
    await toggle();
    expect(fold().attributes('open')).toBeDefined();
    const cancel = fold()
      .findAll('button')
      .find((button) => button.text() === 'Huỷ thay đổi')!;
    await cancel.trigger('click');
    expect(fold().attributes('open')).toBeDefined();
    await toggle();
    expect(fold().attributes('open')).toBeUndefined();
  });

  it('warns about old links only while the address differs from the saved one', async () => {
    const wrapper = await openManage();
    const warning = 'Đổi đường dẫn sẽ làm liên kết cũ không mở được.';
    expect(wrapper.text()).not.toContain(warning);
    await wrapper.get('#org-info-slug').setValue('lhp-moi');
    expect(wrapper.text()).toContain(warning);
    await wrapper.get('#org-info-slug').setValue('lhp');
    expect(wrapper.text()).not.toContain(warning);
  });

  it('shows one markdown editor with Viết and Xem trước tabs', async () => {
    const wrapper = await openManage();
    const tabs = wrapper.findAll('[role="tab"]');
    expect(tabs.map((tab) => tab.text())).toEqual(['Viết', 'Xem trước']);
    expect(tabs[0]!.attributes('aria-selected')).toBe('true');
    await tabs[1]!.trigger('click');
    expect(tabs[1]!.attributes('aria-selected')).toBe('true');
  });
});
