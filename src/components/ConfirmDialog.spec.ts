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

describe('ConfirmDialog returnFocusTo', () => {
  const setup = async () => {
    const target = document.createElement('h2');
    target.tabIndex = -1;
    document.body.append(target);
    const wrapper = mountDialog({ ...ASK, visible: true, returnFocusTo: () => target });
    await flushPromises();
    return { target, wrapper };
  };

  it('focuses the target when closed after a confirm', async () => {
    const { target, wrapper } = await setup();
    buttonNamed('Rời kỳ thi').click();
    await flushPromises();
    await wrapper.setProps({ visible: false });
    await vi.waitFor(() => expect(document.activeElement).toBe(target));
  });

  it('focuses the target when unmounted after a confirm', async () => {
    const { target, wrapper } = await setup();
    buttonNamed('Rời kỳ thi').click();
    await flushPromises();
    wrapper.unmount();
    await vi.waitFor(() => expect(document.activeElement).toBe(target));
  });

  it('does not touch focus when closed by Cancel', async () => {
    const { target, wrapper } = await setup();
    buttonNamed('Hủy').click();
    await flushPromises();
    await wrapper.setProps({ visible: false });
    await flushPromises();
    expect(document.activeElement).not.toBe(target);
  });
});
