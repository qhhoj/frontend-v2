import type { VueWrapper } from '@vue/test-utils';
import { flushPromises } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useLocaleStore } from '@/stores/locale.store';
import { mockApi } from '@/test/mock-api';
import { mountComponent } from '@/test/mount';
import { anonymousViewer } from '@/test/problem-routes';
import StatementBody from './StatementBody.vue';

type Mounted = VueWrapper<InstanceType<typeof StatementBody>>;

const stubClipboard = (writeText: ((text: string) => Promise<void>) | undefined) =>
  Object.defineProperty(navigator, 'clipboard', {
    value: writeText === undefined ? undefined : { writeText },
    configurable: true,
  });

describe('StatementBody', () => {
  beforeEach(() => void mockApi({ ...anonymousViewer }));
  afterEach(() => Reflect.deleteProperty(navigator, 'clipboard'));

  it('adds one copy button per sample block and copies exactly that block, not the button label', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard(writeText);
    const wrapper = mountComponent(StatementBody, {
      props: { html: '<p>x</p><pre>4 4\n1 2 5</pre><pre>0 5 7 8</pre>' },
    });
    await flushPromises();
    const buttons = wrapper.findAll('button.copy-block');
    expect(buttons).toHaveLength(2);
    await buttons[1]!.trigger('click');
    expect(writeText).toHaveBeenCalledWith('0 5 7 8');
  });
  it('does not duplicate buttons when the html changes', async () => {
    stubClipboard(vi.fn().mockResolvedValue(undefined));
    const wrapper = mountComponent(StatementBody, {
      props: { html: '<pre>a</pre>' },
    }) as unknown as Mounted;
    await flushPromises();
    await wrapper.setProps({ html: '<pre>b</pre><pre>c</pre>' });
    await flushPromises();
    expect(wrapper.findAll('button.copy-block')).toHaveLength(2);
  });
  it('keeps copy buttons keyboard reachable with an accessible name', async () => {
    stubClipboard(vi.fn().mockResolvedValue(undefined));
    const wrapper = mountComponent(StatementBody, { props: { html: '<pre>a</pre>' } });
    await flushPromises();
    const button = wrapper.get('button.copy-block');
    expect(button.element.tagName).toBe('BUTTON');
    expect(button.attributes('type')).toBe('button');
    expect(button.attributes('aria-label')).toBe('Sao chép ví dụ');
  });
  it('announces "copied" once in a polite live region after a successful copy', async () => {
    stubClipboard(vi.fn().mockResolvedValue(undefined));
    const wrapper = mountComponent(StatementBody, { props: { html: '<pre>a</pre>' } });
    await flushPromises();
    await wrapper.get('button.copy-block').trigger('click');
    await flushPromises();
    expect(wrapper.get('[aria-live="polite"]').text()).toBe('Đã chép');
  });
  it('stays silent when the browser refuses the copy', async () => {
    stubClipboard(vi.fn().mockRejectedValue(new Error('denied')));
    const wrapper = mountComponent(StatementBody, { props: { html: '<pre>a</pre>' } });
    await flushPromises();
    await wrapper.get('button.copy-block').trigger('click');
    await flushPromises();
    expect(wrapper.get('[aria-live="polite"]').text()).toBe('');
  });
  it('puts the copy bar above the sample so the button never covers sample text', async () => {
    stubClipboard(vi.fn().mockResolvedValue(undefined));
    const wrapper = mountComponent(StatementBody, { props: { html: '<pre>a</pre>' } });
    await flushPromises();
    const pre = wrapper.get('pre');
    expect(pre.find('button').exists()).toBe(false);
    expect(pre.element.previousElementSibling?.classList.contains('copy-bar')).toBe(true);
  });
  it('puts the copy button in the sample title row when a heading precedes the sample', async () => {
    stubClipboard(vi.fn().mockResolvedValue(undefined));
    const wrapper = mountComponent(StatementBody, {
      props: { html: '<h4>Ví dụ vào</h4><pre>a</pre>' },
    });
    await flushPromises();
    expect(wrapper.find('h4 button.copy-block').exists()).toBe(true);
    expect(wrapper.find('.copy-bar').exists()).toBe(false);
  });
  it('relabels the buttons and the announcement when the language changes', async () => {
    stubClipboard(vi.fn().mockResolvedValue(undefined));
    const wrapper = mountComponent(StatementBody, { props: { html: '<pre>a</pre>' } });
    await flushPromises();
    expect(wrapper.get('button.copy-block').text()).toBe('Sao chép');
    useLocaleStore().toggle();
    await flushPromises();
    const button = wrapper.get('button.copy-block');
    expect(button.text()).toBe('Copy');
    expect(button.attributes('aria-label')).toBe('Copy sample');
    await button.trigger('click');
    await flushPromises();
    expect(wrapper.get('[aria-live="polite"]').text()).toBe('Copied');
    useLocaleStore().toggle();
    await flushPromises();
    expect(wrapper.get('button.copy-block').text()).toBe('Đã chép');
    expect(wrapper.get('[aria-live="polite"]').text()).toBe('Đã chép');
  });
  it('names the button by its visible text while "copied" shows, and restores the name after 2 s', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    try {
      stubClipboard(vi.fn().mockResolvedValue(undefined));
      const wrapper = mountComponent(StatementBody, { props: { html: '<pre>a</pre>' } });
      await vi.advanceTimersByTimeAsync(0);
      const button = wrapper.get('button.copy-block');
      await button.trigger('click');
      await vi.advanceTimersByTimeAsync(0);
      expect(button.text()).toBe('Đã chép');
      expect(button.attributes('aria-label')).toBeUndefined();
      await vi.advanceTimersByTimeAsync(1999);
      expect(button.text()).toBe('Đã chép');
      await vi.advanceTimersByTimeAsync(1);
      expect(button.text()).toBe('Sao chép');
      expect(button.attributes('aria-label')).toBe('Sao chép ví dụ');
    } finally {
      vi.useRealTimers();
    }
  });
  it('restarts the 2 s window on a second click and leaves no timer behind after unmount', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    try {
      stubClipboard(vi.fn().mockResolvedValue(undefined));
      const wrapper = mountComponent(StatementBody, { props: { html: '<pre>a</pre>' } });
      await vi.advanceTimersByTimeAsync(0);
      const button = wrapper.get('button.copy-block');
      await button.trigger('click');
      await vi.advanceTimersByTimeAsync(1500);
      await button.trigger('click');
      await vi.advanceTimersByTimeAsync(1500);
      expect(button.text()).toBe('Đã chép'); // 1.5 s after the second click
      await vi.advanceTimersByTimeAsync(500);
      expect(button.text()).toBe('Sao chép');
      await button.trigger('click');
      await vi.advanceTimersByTimeAsync(0);
      wrapper.unmount();
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });
  it('adds no copy button without the Clipboard API and keeps the sample readable', async () => {
    stubClipboard(undefined);
    const wrapper = mountComponent(StatementBody, { props: { html: '<pre>4 4</pre>' } });
    await flushPromises();
    expect(wrapper.find('button.copy-block').exists()).toBe(false);
    expect(wrapper.get('pre').text()).toBe('4 4');
  });
  it('keeps the statement containment class on its root element', () => {
    stubClipboard(undefined);
    const wrapper = mountComponent(StatementBody, { props: { html: '<p>x</p>' } });
    expect(wrapper.classes()).toEqual(expect.arrayContaining(['user-content', 'statement']));
  });
});
