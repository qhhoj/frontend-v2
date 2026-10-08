import { describe, expect, it } from 'vitest';
import { contestItem, HOME_COUNTS } from '@/test/fixtures';
import { homeResponse, postItem } from '@/test/community-fixtures';
import { mockApi, ok, page } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { anonymousViewer } from '@/test/problem-routes';
import UserAvatar from '@/mascot/avatar/UserAvatar.vue';

const anonymousHomeRoutes = {
  ...anonymousViewer,
  'GET /home': ok(
    homeResponse({ counts: { ...HOME_COUNTS, problems: 1284, submissions: 318420 } }),
  ),
  'GET /contests': page([contestItem(), contestItem({ key: 'r43', name: 'QHH Round #43' })]),
  'GET /posts': page([postItem({ sticky: true })]),
};

describe('anonymous home', () => {
  it('greets with the hero, the counts, three actions and the capped Bit', async () => {
    mockApi(anonymousHomeRoutes);
    const { wrapper } = await mountApp('/');
    const hero = wrapper.get('[data-testid="anonymous-hero"]');
    expect(hero.get('h1').text()).toBe('Luyện thuật toán mỗi ngày, thi đấu cùng cả nước');
    expect(hero.text()).toContain('1.284 bài tập');
    expect(hero.findAll('a').map((link) => link.attributes('href'))).toEqual([
      '/register',
      '/login',
      '/problems',
    ]);
    expect(hero.get('[data-testid="home-bit"]').attributes('aria-label')).toBe(
      'Bit đội mũ tốt nghiệp',
    );
    expect(hero.get('[data-testid="home-counts"]').text()).toContain('318.420');
  });
  it('shows up to two running contests with an elapsed bar a screen reader can read', async () => {
    mockApi(anonymousHomeRoutes);
    const { wrapper } = await mountApp('/');
    const card = wrapper.get('[data-testid="running-contests"]');
    expect(card.findAll('article')).toHaveLength(2);
    expect(card.find('[role="img"][aria-label^="Đã qua"]').exists()).toBe(true);
  });
});

describe('anonymous home lists', () => {
  it('lists new posts, top PP with avatars, top contributors, new problems and recent comments', async () => {
    mockApi(anonymousHomeRoutes);
    const { wrapper } = await mountApp('/');
    expect(wrapper.get('[data-testid="new-posts"]').text()).toContain('Ghim');
    expect(
      wrapper.get('[data-testid="top-performers"]').findAllComponents(UserAvatar),
    ).toHaveLength(1);
    expect(wrapper.get('[data-testid="top-performers"]').text()).toContain('8.120 PP');
    expect(wrapper.text()).toContain('Top đóng góp');
    expect(wrapper.text()).toContain('Bài tập mới');
    expect(wrapper.text()).toContain('Bình luận gần đây');
  });
  it('shows the contest Bit when nothing is running', async () => {
    mockApi({ ...anonymousHomeRoutes, 'GET /contests': page([]) });
    const { wrapper } = await mountApp('/');
    expect(
      wrapper.find('[data-testid="running-contests"] [data-bit-variant="contest"]').exists(),
    ).toBe(true);
  });
});
