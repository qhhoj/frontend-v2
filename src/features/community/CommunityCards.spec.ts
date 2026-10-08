import { flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { homeResponse, recentComment } from '@/test/community-fixtures';
import { mockApi, ok } from '@/test/mock-api';
import { mountComponent } from '@/test/mount';
import { anonymousViewer } from '@/test/problem-routes';
import RecentCommentsCard from './RecentCommentsCard.vue';
import TopContributorsCard from './TopContributorsCard.vue';

describe('community cards', () => {
  it('cut the home lists to their limit', async () => {
    mockApi({
      ...anonymousViewer,
      'GET /home': ok(
        homeResponse({
          recentComments: [1, 2, 3, 4, 5].map((index) => recentComment({ id: `c${index}` })),
        }),
      ),
    });
    const card = mountComponent(RecentCommentsCard, { props: { limit: 3 } });
    await flushPromises();
    expect(card.findAll('article')).toHaveLength(3);
  });
  it('rank contributors with their points', async () => {
    mockApi({ ...anonymousViewer, 'GET /home': ok(homeResponse()) });
    const card = mountComponent(TopContributorsCard, { props: { limit: 3 } });
    await flushPromises();
    expect(card.get('li').text()).toMatch(/1\s*thayhung\s*1\.840/);
  });
});
