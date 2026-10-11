import { flushPromises } from '@vue/test-utils';
import type { VueWrapper } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { sessionUser } from '@/test/fixtures';
import { mockApi, page } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { signedInViewer } from '@/test/problem-routes';

const CHANGE_TICKET = 'judge.change_ticket';

describe('ticket list: staff and closed filters', () => {
  it('gives the creator and assignee filters to the judge.change_ticket permission, not to the staff flag', async () => {
    mockApi({
      ...signedInViewer({ user: sessionUser({ isStaff: true, permissions: [] }) }),
      'GET /tickets': page([]),
    });
    expect((await mountApp('/tickets')).wrapper.find('input[name="user"]').exists()).toBe(false);
    mockApi({
      ...signedInViewer({ user: sessionUser({ permissions: [CHANGE_TICKET] }) }),
      'GET /tickets': page([]),
    });
    expect((await mountApp('/tickets')).wrapper.find('input[name="user"]').exists()).toBe(true);
  });
});

describe('ticket list: staff inputs follow the route', () => {
  const typeCreator = async (wrapper: VueWrapper, text: string) => {
    const input = wrapper.get('input[name="user"]');
    await input.setValue(text);
    await input.trigger('blur');
    await flushPromises();
  };
  it('shows the restored filters after Back, and a blur does not push the older text', async () => {
    mockApi({
      ...signedInViewer({ user: sessionUser({ permissions: [CHANGE_TICKET] }) }),
      'GET /tickets': page([]),
    });
    const { wrapper, router } = await mountApp('/tickets');
    await typeCreator(wrapper, 'alpha');
    await typeCreator(wrapper, 'bravo');
    router.back();
    await vi.waitFor(() =>
      expect((wrapper.get('input[name="user"]').element as HTMLInputElement).value).toBe('alpha'),
    );
    await wrapper.get('input[name="user"]').trigger('blur');
    await flushPromises();
    expect(router.currentRoute.value.query).toEqual({ user: 'alpha' });
  });
});
