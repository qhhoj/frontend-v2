import { flushPromises } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import { describe, expect, it } from 'vitest';
import { useQueryClient } from '@tanstack/vue-query';
import { signedIn, userPage } from '@/test/fixtures';
import { mockApi, ok } from '@/test/mock-api';
import { mountComponent } from '@/test/mount';
import { useSessionStore } from '@/stores/session.store';
import { useUserPageQuery } from './users.queries';

describe('user page query', () => {
  it('keeps one cache entry per viewer, so an account switch never shows the previous viewer’s answer', async () => {
    mockApi({
      'GET /auth/me': signedIn(),
      'GET /users/user_02': ok(userPage({ username: 'user_02' })),
    });
    let keys: unknown[][] = [];
    const Probe = defineComponent(() => {
      useUserPageQuery('user_02');
      const client = useQueryClient();
      return () =>
        h('p', {
          onClick: () =>
            (keys = client
              .getQueryCache()
              .getAll()
              .map((query) => [...query.queryKey])),
        });
    });
    const wrapper = mountComponent(Probe);
    await useSessionStore().ensureLoaded();
    await flushPromises();
    await wrapper.get('p').trigger('click');
    expect(keys).toContainEqual([
      'users',
      'page',
      'user_02',
      '0192a000-0000-7000-8000-000000000001',
    ]);
  });
});
