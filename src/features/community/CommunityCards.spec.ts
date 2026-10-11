import { flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { homeResponse } from '@/test/community-fixtures';
import { fail, mockApi, ok, sequence } from '@/test/mock-api';
import { mountComponent } from '@/test/mount';
import { anonymousViewer } from '@/test/problem-routes';
import RecentCommentsCard from './RecentCommentsCard.vue';

describe('community cards: loading failure', () => {
  it('offers a retry that asks the home data again', async () => {
    const calls = mockApi({
      ...anonymousViewer,
      'GET /home': sequence(fail(403, 'forbidden'), ok(homeResponse())),
    });
    const card = mountComponent(RecentCommentsCard, { props: { limit: 3 } });
    await flushPromises();
    expect(card.find('[role="alert"]').exists()).toBe(true);
    await card.get('button').trigger('click');
    await flushPromises();
    expect(calls.filter((call) => call.path === '/home')).toHaveLength(2);
    expect(card.findAll('article')).toHaveLength(1);
  });
});
