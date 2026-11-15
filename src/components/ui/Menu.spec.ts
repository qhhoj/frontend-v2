import { flushPromises } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import { describe, expect, it, vi } from 'vitest';
import { mountComponent } from '@/test/mount';
import Menu from './Menu.vue';
import type { MenuEntry } from './Menu.vue';
import Modal from './Modal.vue';

const list = () => document.querySelector<HTMLElement>('[role="menu"]');
const key = (name: string) =>
  list()!.dispatchEvent(
    new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true }),
  );

/** A Menu whose trigger is `#opener`, optionally inside an open Modal; resolves to the Modal's `update:visible` spy. */
async function openByKeyboard(items: MenuEntry[], inModal = false) {
  const onUpdate = vi.fn();
  const menu = () =>
    h(
      Menu,
      { items, label: 'Thao tác' },
      {
        trigger: ({ toggle }: { toggle: (event: Event) => void }) =>
          h('button', { id: 'opener', onClick: toggle }),
      },
    );
  mountComponent(
    defineComponent({
      setup: () => () =>
        inModal
          ? h(Modal, { visible: true, title: 'A', 'onUpdate:visible': onUpdate }, menu)
          : menu(),
    }),
  );
  await flushPromises();
  const opener = document.getElementById('opener')!;
  opener.focus();
  opener.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 0 })); // Enter or Space on a button
  await flushPromises();
  return onUpdate;
}

describe('Menu', () => {
  it('opens from the keyboard on its first item, skips disabled ones and runs the pick with focus back on the opener', async () => {
    const copy = vi.fn();
    await openByKeyboard([
      { label: 'Mở', run: vi.fn() },
      { label: 'Khóa', disabled: true },
      { label: 'Sao chép', run: copy },
    ]);
    expect(document.activeElement).toBe(list());
    const activeLabel = () =>
      document.getElementById(list()!.getAttribute('aria-activedescendant')!)!.textContent;
    expect(activeLabel()).toBe('Mở');
    key('ArrowDown');
    await flushPromises();
    expect(activeLabel()).toBe('Sao chép');
    key('Enter');
    await flushPromises();
    expect(copy).toHaveBeenCalledOnce();
    expect(list()).toBeNull();
    expect(document.activeElement?.id).toBe('opener');
  });

  it('opens inside a dialog and takes Escape for itself: the menu closes, the dialog stays', async () => {
    const onUpdate = await openByKeyboard([{ label: 'Mở', run: vi.fn() }], true);
    expect(list()!.closest('dialog')).not.toBeNull();
    key('Escape');
    await flushPromises();
    expect(list()).toBeNull();
    expect(onUpdate).not.toHaveBeenCalled();
    expect(document.activeElement?.id).toBe('opener');
  });
});
