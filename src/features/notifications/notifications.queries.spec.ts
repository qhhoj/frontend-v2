import { flushPromises } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import { describe, expect, it } from 'vitest';
import { mockApi, noContent, ok, page } from '@/test/mock-api';
import { mountComponent } from '@/test/mount';
import { notificationItem } from '@/test/notification-fixtures';
import { anonymousViewer, signedInViewer } from '@/test/problem-routes';
import { useMarkRead, useNotificationsQuery, useUnreadCountQuery } from './notifications.queries';

const Probe = defineComponent({
  setup() {
    const count = useUnreadCountQuery();
    const list = useNotificationsQuery({ state: 'all', page: 1 });
    const markRead = useMarkRead();
    return () =>
      h('div', [
        h('p', { id: 'count' }, String(count.data.value?.count ?? '-')),
        h('p', { id: 'rows' }, String(list.data.value?.items.length ?? '-')),
        h('button', { onClick: () => markRead.mutate('n-1') }, 'read'),
      ]);
  },
});

describe('notification queries', () => {
  it('reads nothing while signed out', async () => {
    const calls = mockApi({
      ...anonymousViewer,
      'GET /notifications/unread-count': ok({ count: 2 }),
      'GET /notifications': page([notificationItem()]),
    });
    const wrapper = mountComponent(Probe);
    await flushPromises();
    expect(wrapper.get('#count').text()).toBe('-');
    expect(calls.filter((call) => call.path.startsWith('/notifications'))).toHaveLength(0);
  });

  it('refetches the count and the list after one row is marked read', async () => {
    let unread = 2;
    const calls = mockApi({
      ...signedInViewer(),
      'GET /notifications/unread-count': () => ok({ count: unread }),
      'GET /notifications': page([notificationItem()]),
      'POST /notifications/n-1/read': () => {
        unread = 1;
        return noContent();
      },
    });
    const wrapper = mountComponent(Probe);
    await flushPromises();
    expect(wrapper.get('#count').text()).toBe('2');
    await wrapper.get('button').trigger('click');
    await flushPromises();
    expect(wrapper.get('#count').text()).toBe('1');
    expect(calls.filter((call) => call.path === '/notifications')).toHaveLength(2);
  });
});
