import { flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { mountComponent } from '@/test/mount';
import Modal from './Modal.vue';

const dialog = () => document.body.querySelector<HTMLElement>('[role="dialog"]')!;
const pressEscape = () =>
  document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', bubbles: true }));

describe('Modal', () => {
  it('fills a phone screen only when sized', async () => {
    mountComponent(Modal, { props: { visible: true, title: 'A', size: 'md' } });
    await flushPromises();
    expect(dialog().className).toContain('max-sm:w-screen');
    expect(dialog().className).toContain('sm:w-[min(40rem,calc(100vw-2rem))]');
  });

  it('keeps the preset width when no size is given', async () => {
    mountComponent(Modal, { props: { visible: true, title: 'A' } });
    await flushPromises();
    expect(dialog().className).not.toContain('max-sm:w-screen');
  });

  it('closes on Escape, and stays open when not closable', async () => {
    const open = mountComponent(Modal, { props: { visible: true, title: 'A' } });
    await flushPromises();
    pressEscape();
    await flushPromises();
    expect(open.emitted('update:visible')).toEqual([[false]]);
    open.unmount();

    const locked = mountComponent(Modal, { props: { visible: true, title: 'B', closable: false } });
    await flushPromises();
    expect(dialog().querySelector('button[aria-label]')).toBeNull();
    pressEscape();
    await flushPromises();
    expect(locked.emitted('update:visible')).toBeUndefined();
  });
});
