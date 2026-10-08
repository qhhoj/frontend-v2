import { flushPromises } from '@vue/test-utils';
import type { VueWrapper } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { mountComponent } from '@/test/mount';
import ConfirmDialog from './ConfirmDialog.vue';

const ASK = { title: 'Rời kỳ thi?', body: 'Điểm giữ nguyên.', confirmLabel: 'Rời kỳ thi' };
const dialog = () => document.body.querySelector<HTMLElement>('[role="dialog"]')!;
const buttonNamed = (name: string) =>
  [...dialog().querySelectorAll<HTMLButtonElement>('button')].find(
    (button) => button.textContent?.trim() === name,
  )!;
const pressEscape = () =>
  document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', bubbles: true }));
const mountDialog = (props: Record<string, unknown>) =>
  mountComponent(ConfirmDialog, { props }) as unknown as VueWrapper<{
    visible: boolean;
    canConfirm: boolean;
  }>;

describe('ConfirmDialog', () => {
  it('shows its title, body and labels', async () => {
    mountComponent(ConfirmDialog, { props: { ...ASK, visible: true } });
    await flushPromises();
    expect(dialog().textContent).toContain('Rời kỳ thi?');
    expect(dialog().textContent).toContain('Điểm giữ nguyên.');
    expect(buttonNamed('Rời kỳ thi')).toBeDefined();
    expect(buttonNamed('Hủy')).toBeDefined();
  });

  it('uses the cancel label it is given', async () => {
    mountComponent(ConfirmDialog, { props: { ...ASK, cancelLabel: 'Ở lại', visible: true } });
    await flushPromises();
    expect(buttonNamed('Ở lại')).toBeDefined();
  });

  it('renders the default slot as the body and the error slot inside the dialog', async () => {
    mountComponent(ConfirmDialog, {
      props: { title: 'Nộp', confirmLabel: 'Nộp', visible: true },
      slots: { default: '<p>Nội dung tuỳ chỉnh</p>', error: '<p role="alert">Lỗi</p>' },
    });
    await flushPromises();
    expect(dialog().querySelector('[role="alert"]')!.textContent).toBe('Lỗi');
    expect(dialog().textContent).toContain('Nội dung tuỳ chỉnh');
  });

  it('describes the dialog by its body', async () => {
    mountComponent(ConfirmDialog, { props: { ...ASK, visible: true } });
    await flushPromises();
    const describedBy = dialog().getAttribute('aria-describedby')!;
    expect(describedBy).not.toBe('');
    expect(document.getElementById(describedBy)!.textContent).toContain('Điểm giữ nguyên.');
  });

  it('confirms when the confirm button is pressed', async () => {
    const wrapper = mountComponent(ConfirmDialog, { props: { ...ASK, visible: true } });
    await flushPromises();
    buttonNamed('Rời kỳ thi').click();
    await flushPromises();
    expect(wrapper.emitted('confirm')).toHaveLength(1);
  });

  it('does not confirm while busy', async () => {
    const wrapper = mountComponent(ConfirmDialog, { props: { ...ASK, visible: true, busy: true } });
    await flushPromises();
    buttonNamed('Rời kỳ thi').click();
    await flushPromises();
    expect(wrapper.emitted('confirm')).toBeUndefined();
    expect(buttonNamed('Rời kỳ thi').getAttribute('aria-busy')).toBe('true');
  });

  it('closes without confirming when cancelled', async () => {
    const wrapper = mountComponent(ConfirmDialog, { props: { ...ASK, visible: true } });
    await flushPromises();
    buttonNamed('Hủy').click();
    await flushPromises();
    expect(wrapper.emitted('update:visible')).toEqual([[false]]);
    expect(wrapper.emitted('confirm')).toBeUndefined();
  });

  it('closes on Escape when idle', async () => {
    const wrapper = mountComponent(ConfirmDialog, { props: { ...ASK, visible: true } });
    await flushPromises();
    pressEscape();
    await flushPromises();
    expect(wrapper.emitted('update:visible')).toEqual([[false]]);
  });

  it('blocks Cancel and Escape while busy', async () => {
    const wrapper = mountComponent(ConfirmDialog, { props: { ...ASK, visible: true, busy: true } });
    await flushPromises();
    buttonNamed('Hủy').click();
    pressEscape();
    await flushPromises();
    expect(wrapper.emitted('update:visible')).toBeUndefined();
  });
});

describe('ConfirmDialog with an input in its body', () => {
  it('emits once when the form is submitted', async () => {
    const wrapper = mountComponent(ConfirmDialog, { props: { ...ASK, visible: true } });
    await flushPromises();
    dialog()
      .querySelector('form')!
      .dispatchEvent(new Event('submit', { cancelable: true }));
    expect(wrapper.emitted('confirm')).toHaveLength(1);
  });

  it('cannot confirm while canConfirm is false: aria-disabled and no event, by button or by Enter', async () => {
    const wrapper = mountDialog({ ...ASK, visible: true, canConfirm: false });
    await flushPromises();
    expect(buttonNamed('Rời kỳ thi').getAttribute('aria-disabled')).toBe('true');
    buttonNamed('Rời kỳ thi').click();
    dialog()
      .querySelector('form')!
      .dispatchEvent(new Event('submit', { cancelable: true }));
    expect(wrapper.emitted('confirm')).toBeUndefined();
    await wrapper.setProps({ canConfirm: true });
    expect(buttonNamed('Rời kỳ thi').getAttribute('aria-disabled')).toBeNull();
    buttonNamed('Rời kỳ thi').click();
    await flushPromises();
    expect(wrapper.emitted('confirm')).toHaveLength(1);
  });

  it('labels the close button with common.close', async () => {
    mountComponent(ConfirmDialog, { props: { ...ASK, visible: true } });
    await flushPromises();
    expect(dialog().querySelector('button[aria-label="Đóng"]')).not.toBeNull();
  });

  // Regression guard for PrimeVue's own focus restore (ConfirmDialog no longer implements it).
  it('gives focus back to the element that opened it', async () => {
    const opener = document.createElement('button');
    document.body.append(opener);
    opener.focus();
    const wrapper = mountDialog({ ...ASK, visible: false });
    await wrapper.setProps({ visible: true });
    await flushPromises();
    await wrapper.setProps({ visible: false });
    await vi.waitFor(() => expect(document.activeElement).toBe(opener));
    opener.remove();
  });
});
