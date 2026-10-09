import { describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { fail, mockApi, ok } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { openDialog, staffViewer } from '@/test/admin-routes';
import { judge } from '@/test/admin-fixtures/judges';

const KEY = 'k7Qm2xV9aR4tLw0ZpB8sNf3YcHu5JdEe6GiTo1XvMqA=';
/** Lets a hidden dialog's leave transition finish (it runs on animation frames, so flushing promises is not enough). */
const settle = () => new Promise((resolve) => setTimeout(resolve, 400));
/** The key is on screen. A closed PrimeVue dialog can linger in jsdom (its leave transition never finishes there), so the key's text is the test. */
const keyShown = () => document.body.textContent?.includes(KEY) ?? false;
const storedValues = (storage: Storage) =>
  Array.from({ length: storage.length }, (_item, index) =>
    storage.getItem(storage.key(index)!),
  ).join('\n');
const clickMask = async () => {
  const mask = document.body.querySelector('[data-pc-section="mask"]')!;
  mask.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
  mask.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
  await flushPromises();
};

/** The screen is a lazy route: the form is there once its chunk has loaded. */
const mountAddPage = async () => {
  const mounted = await mountApp('/admin/judges/new');
  await vi.waitFor(() => expect(mounted.wrapper.find('#judge-name').exists()).toBe(true));
  return mounted;
};

describe('judge key reveal', () => {
  it('creates a judge, shows its key once and only closes after the acknowledgement', async () => {
    mockApi({
      ...staffViewer(['judge.change_judge']),
      'POST /judges': ok({ judge: judge({ name: 'qhh-judge-06' }), authKey: KEY }),
      'GET /judges': ok([]),
    });
    const { wrapper, queryClient } = await mountAddPage();
    await wrapper.get('#judge-name').setValue('qhh-judge-06');
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Tạo và lấy khoá')!
      .trigger('click');
    await flushPromises();
    expect(openDialog().textContent).toContain(KEY);
    const close = openDialog().querySelector('[data-testid="key-close"]') as HTMLButtonElement;
    expect(close.getAttribute('aria-disabled')).toBe('true');

    // Nothing dismisses it before the acknowledgement: Escape, the Close button, and the mask.
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape' }));
    await flushPromises();
    await settle();
    expect(keyShown()).toBe(true);
    close.click();
    await flushPromises();
    await settle();
    expect(keyShown()).toBe(true);
    await clickMask();
    await settle();
    expect(keyShown()).toBe(true);

    (openDialog().querySelector('#key-saved') as HTMLInputElement).click();
    await flushPromises();
    expect(close.getAttribute('aria-disabled')).toBeNull();
    close.click();
    await flushPromises();
    await vi.waitFor(() => expect(keyShown()).toBe(false));

    expect(
      JSON.stringify(
        queryClient
          .getQueryCache()
          .getAll()
          .map((query) => query.state.data),
      ),
    ).not.toContain(KEY);
    // The app keeps its own preferences in storage, so the check is that no stored value holds the key.
    expect(storedValues(localStorage)).not.toContain(KEY);
    expect(storedValues(sessionStorage)).not.toContain(KEY);
  });

  it('refuses a malformed name before sending and shows a taken name from the backend', async () => {
    // The backend answers a taken name with 409 `conflict` and `fields.name` (judges.service.ts), not with an issue.
    const calls = mockApi({
      ...staffViewer(['judge.change_judge']),
      'POST /judges': fail(409, 'conflict', { name: ['This name is taken.'] }),
    });
    const { wrapper } = await mountAddPage();
    await wrapper.get('#judge-name').setValue('bad name');
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Tạo và lấy khoá')!
      .trigger('click');
    await flushPromises();
    expect(calls.some((call) => call.method === 'POST')).toBe(false);
    await wrapper.get('#judge-name').setValue('qhh-judge-01');
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Tạo và lấy khoá')!
      .trigger('click');
    await flushPromises();
    expect(wrapper.get('#judge-name').attributes('aria-invalid')).toBe('true');
    expect(wrapper.text()).toContain('Tên máy đã được dùng.');
  });
});
