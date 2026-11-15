import { flushPromises } from '@vue/test-utils';
import { defineComponent, h, ref } from 'vue';
import { describe, expect, it } from 'vitest';
import { mountComponent } from '@/test/mount';
import Modal from './Modal.vue';

const dialog = () => document.body.querySelector<HTMLElement>('[role="dialog"]')!;
const pressEscape = () =>
  document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', bubbles: true }));

describe('Modal', () => {
  it('fills a phone screen only when lg', async () => {
    mountComponent(Modal, { props: { visible: true, title: 'A', size: 'lg' } });
    await flushPromises();
    expect(dialog().className).toContain('max-sm:w-screen');
    expect(dialog().className).toContain('sm:w-[min(47.5rem,calc(100vw-2rem))]');
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

  it('opens on the first field, not on the close button', async () => {
    mountComponent(Modal, {
      props: { visible: true, title: 'A' },
      slots: { default: '<input id="first" />' },
    });
    await flushPromises();
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(document.activeElement?.id).toBe('first');
  });

  it('opens on the first footer button when the body has no field', async () => {
    mountComponent(Modal, {
      props: { visible: true, title: 'A' },
      slots: { default: '<p>Text</p>', footer: '<button id="cancel">Hủy</button>' },
    });
    await flushPromises();
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(document.activeElement?.id).toBe('cancel');
  });

  it('gives focus back to its opener when Escape closes it', async () => {
    const opener = document.createElement('button');
    document.body.append(opener);
    opener.focus();
    const visible = ref(true);
    mountComponent(
      defineComponent({
        setup: () => () =>
          h(
            Modal,
            {
              visible: visible.value,
              'onUpdate:visible': (next: boolean) => (visible.value = next),
              title: 'A',
            },
            () => h('input', { id: 'first' }),
          ),
      }),
    );
    await flushPromises();
    expect(document.activeElement?.id).toBe('first');
    pressEscape();
    await flushPromises();
    expect(dialog()).toBeNull();
    expect(document.activeElement).toBe(opener);
  });

  it('closes on a click outside only when dismissable', async () => {
    const clickBackdrop = () => {
      const outside = { bubbles: true, clientX: 900, clientY: 900 };
      dialog().dispatchEvent(new MouseEvent('pointerdown', outside));
      dialog().dispatchEvent(new MouseEvent('click', outside));
    };
    const plain = mountComponent(Modal, { props: { visible: true, title: 'A' } });
    await flushPromises();
    clickBackdrop();
    expect(plain.emitted('update:visible')).toBeUndefined();
    plain.unmount();

    const dismissable = mountComponent(Modal, {
      props: { visible: true, title: 'B', dismissable: true },
    });
    await flushPromises();
    clickBackdrop();
    expect(dismissable.emitted('update:visible')).toEqual([[false]]);
  });

  it('leaves Escape to the page while it is closed', async () => {
    mountComponent(Modal, { props: { visible: false, title: 'A' } });
    await flushPromises();
    const escape = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    document.dispatchEvent(escape);
    expect(escape.defaultPrevented).toBe(false);
  });

  it('stays open when a field inside sends a cancel (a file picker dismissed)', async () => {
    const open = mountComponent(Modal, {
      props: { visible: true, title: 'A' },
      slots: { default: '<input id="file" type="file" />' },
    });
    await flushPromises();
    document
      .getElementById('file')!
      .dispatchEvent(new Event('cancel', { bubbles: true, cancelable: true }));
    expect(open.emitted('update:visible')).toBeUndefined();
  });

  it('ignores the close event of the dialog it replaced on a quick reopen', async () => {
    const visible = ref(true);
    mountComponent(
      defineComponent({
        setup: () => () =>
          h(Modal, {
            visible: visible.value,
            'onUpdate:visible': (next: boolean) => (visible.value = next),
            title: 'A',
          }),
      }),
    );
    await flushPromises();
    const first = dialog();
    visible.value = false;
    await flushPromises();
    visible.value = true;
    await flushPromises();
    first.dispatchEvent(new Event('close'));
    await flushPromises();
    expect(visible.value).toBe(true);
    expect(dialog()).not.toBe(first);
  });
});
