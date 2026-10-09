import { flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { ApiError } from '@/api/client';
import { RULES_HTML } from '@/test/contest-extras-fixtures';
import { mountComponent } from '@/test/mount';
import ContestRulesDialog from './ContestRulesDialog.vue';

const dialog = () => document.body.querySelector<HTMLElement>('[role="dialog"]')!;
const confirmButton = () => dialog().querySelector<HTMLButtonElement>('button[type="submit"]')!;
const box = () => dialog().querySelector<HTMLInputElement>('input[type="checkbox"]')!;
const submit = async () => {
  dialog().querySelector('form')!.dispatchEvent(new Event('submit'));
  await flushPromises();
};
/** The wrapper's `setProps` is typed by the component's declared props, which a v-model prop does not widen. */
type Updatable = { setProps: (props: Record<string, unknown>) => Promise<void> };
const mountDialog = (props: Record<string, unknown> = {}) =>
  mountComponent(ContestRulesDialog, {
    props: {
      visible: true,
      contestName: 'Thi thử HSG Quốc gia · Đề 2',
      revision: 3,
      rulesHtml: RULES_HTML,
      actionLabel: 'Đăng ký tham gia',
      isVirtual: false,
      isPending: false,
      isRefreshing: false,
      error: null,
      ...props,
    },
  }) as unknown as ReturnType<typeof mountComponent> & Updatable;

describe('contest rules dialog', () => {
  it('shows the rules with their revision and keeps the confirm disabled until the box is ticked', async () => {
    const wrapper = mountDialog();
    await flushPromises();
    expect(dialog().textContent).toContain('phiên bản quy định 3');
    expect(dialog().querySelector('.user-content')!.innerHTML).toContain('Trung thực');
    expect(confirmButton().getAttribute('aria-disabled')).toBe('true');
    await submit();
    expect(wrapper.emitted('accept')).toBeUndefined();
    box().click();
    await flushPromises();
    expect(confirmButton().hasAttribute('aria-disabled')).toBe(false);
    await submit();
    expect(wrapper.emitted('accept')).toHaveLength(1);
  });

  it('is drawn 520 px wide, as the mock-up has it', async () => {
    mountDialog();
    await flushPromises();
    expect(dialog().style.width).toBe('520px');
  });

  it('says every virtual run asks again', async () => {
    mountDialog({ isVirtual: true, actionLabel: 'Bắt đầu lượt ảo' });
    await flushPromises();
    expect(dialog().textContent).toContain('Mỗi lượt thi ảo cần đồng ý lại');
  });

  it('shows a refusal inside the dialog with Bit and keeps the tick', async () => {
    const wrapper = mountDialog();
    await flushPromises();
    box().click();
    await flushPromises();
    await wrapper.setProps({ error: new ApiError('rules_not_accepted', 400, 'x') });
    await flushPromises();
    const alert = dialog().querySelector('[role="alert"]')!;
    expect(alert.textContent).toContain('Hãy chọn ô đồng ý');
    expect(alert.querySelector('[data-testid="inline-bit"]')).not.toBeNull();
    expect(box().checked).toBe(true);
  });

  it('untick on close: a new opening starts unticked', async () => {
    const wrapper = mountDialog();
    await flushPromises();
    box().click();
    await wrapper.setProps({ visible: false });
    await flushPromises();
    await wrapper.setProps({ visible: true });
    await flushPromises();
    expect(box().checked).toBe(false);
  });

  it('shows inert lines and refuses to confirm while the rules text is not loaded', async () => {
    mountDialog({ rulesHtml: '', isRefreshing: true });
    await flushPromises();
    expect(dialog().querySelectorAll('[data-skeleton-region="rules-line"]')).toHaveLength(4);
    box().click();
    await flushPromises();
    expect(confirmButton().getAttribute('aria-disabled')).toBe('true');
  });

  it('lets the viewer accept when the final rendered rules text is empty', async () => {
    const wrapper = mountDialog({ rulesHtml: '', isRefreshing: false });
    await flushPromises();
    expect(dialog().querySelectorAll('[data-skeleton-region="rules-line"]')).toHaveLength(0);
    box().click();
    await flushPromises();
    await submit();
    expect(wrapper.emitted('accept')).toHaveLength(1);
  });

  it('sends nothing more while the request runs', async () => {
    const wrapper = mountDialog({ isPending: true });
    await flushPromises();
    box().click();
    await submit();
    expect(wrapper.emitted('accept')).toBeUndefined();
  });
});
