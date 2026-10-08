import { flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { homeResponse, recentComment } from '@/test/community-fixtures';
import { fail, mockApi, ok, sequence } from '@/test/mock-api';
import { mountComponent } from '@/test/mount';
import { anonymousViewer } from '@/test/problem-routes';
import NewProblemsCard from './NewProblemsCard.vue';
import RecentCommentsCard from './RecentCommentsCard.vue';
import TopContributorsCard from './TopContributorsCard.vue';

describe('community cards: lists', () => {
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
  it('shows the empty line when no comment is recent', async () => {
    mockApi({ ...anonymousViewer, 'GET /home': ok(homeResponse({ recentComments: [] })) });
    const card = mountComponent(RecentCommentsCard, { props: { limit: 3 } });
    await flushPromises();
    expect(card.text()).toContain('Chưa có bình luận nào.');
  });
});

describe('community cards: problems variants', () => {
  it('writes the code, the date and the points out on the home variant', async () => {
    mockApi({ ...anonymousViewer, 'GET /home': ok(homeResponse()) });
    const card = mountComponent(NewProblemsCard, { props: { limit: 4, variant: 'home' } });
    await flushPromises();
    expect(card.text()).toContain('hcmus41a · 08/10');
    expect(card.text()).toContain('100 điểm');
  });
  it('shows only the name and the bare points on the rail', async () => {
    mockApi({ ...anonymousViewer, 'GET /home': ok(homeResponse()) });
    const card = mountComponent(NewProblemsCard, { props: { limit: 4 } });
    await flushPromises();
    expect(card.text()).toContain('Dãy số đẹp');
    expect(card.text()).not.toContain('hcmus41a ·');
    expect(card.text()).not.toContain('điểm');
  });
});

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
