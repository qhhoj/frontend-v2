import { flushPromises } from '@vue/test-utils';
import type { VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useSessionStore } from '@/stores/session.store';
import { sessionUser } from '@/test/fixtures';
import { mountComponent } from '@/test/mount';
import ScratchCodesPanel from './ScratchCodesPanel.vue';

const CODES = ['K7QM2XRA9PTD4WLE', 'H3ZN8CVB5YJF1MSU'];
const PROPS = { codes: CODES, username: 'bitcoder', notice: 'Đã bật' };
const button = (wrapper: VueWrapper, text: string) =>
  wrapper.findAll('button').find((candidate) => candidate.text() === text)!;
const printScope = () => document.documentElement.dataset.printScope;

afterEach(() => {
  vi.restoreAllMocks();
  delete document.documentElement.dataset.printScope;
});

describe('ScratchCodesPanel printing', () => {
  it('keeps the print scope until afterprint, even when window.print returns at once', async () => {
    const print = vi.spyOn(window, 'print').mockImplementation(() => undefined);
    const wrapper = mountComponent(ScratchCodesPanel, { props: PROPS });
    await flushPromises();
    await button(wrapper, 'In').trigger('click');
    expect(print).toHaveBeenCalledOnce();
    expect(printScope()).toBe('codes');
    window.dispatchEvent(new Event('afterprint'));
    expect(printScope()).toBeUndefined();
  });

  it('clears the print scope on unmount when afterprint never fires', async () => {
    vi.spyOn(window, 'print').mockImplementation(() => undefined);
    const wrapper = mountComponent(ScratchCodesPanel, { props: PROPS });
    await flushPromises();
    await button(wrapper, 'In').trigger('click');
    expect(printScope()).toBe('codes');
    wrapper.unmount();
    expect(printScope()).toBeUndefined();
  });
});

describe('ScratchCodesPanel download', () => {
  it('revokes the download URL only after the click has been handled', async () => {
    const revoke = vi.fn();
    Object.assign(URL, { createObjectURL: vi.fn(() => 'blob:codes'), revokeObjectURL: revoke });
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined);
    const wrapper = mountComponent(ScratchCodesPanel, { props: PROPS });
    await flushPromises();
    await button(wrapper, 'Tải về .txt').trigger('click');
    expect(click).toHaveBeenCalledOnce();
    expect(revoke).not.toHaveBeenCalled();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(revoke).toHaveBeenCalledWith('blob:codes');
  });
});

describe('ScratchCodesPanel when the session ends', () => {
  it('closes at once, so the codes leave the screen, even though the box was never ticked', async () => {
    const wrapper = mountComponent(ScratchCodesPanel, { props: PROPS });
    const session = useSessionStore();
    session.user = sessionUser({ id: 'user-a' });
    await flushPromises();
    expect(wrapper.emitted('done')).toBeUndefined();
    session.user = null;
    await flushPromises();
    expect(wrapper.emitted('done')).toHaveLength(1);
  });
});
