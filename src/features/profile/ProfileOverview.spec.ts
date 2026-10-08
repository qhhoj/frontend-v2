import { expect, it } from 'vitest';
import { userPage } from '@/test/fixtures';
import { profileRoutes } from '@/test/community-routes';
import { hangRequestsExcept, mockApi, ok } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { anonymousViewer } from '@/test/problem-routes';

it('shows the chart, the heatmap, recent contests, stats, about and organizations', async () => {
  mockApi({
    ...anonymousViewer,
    ...profileRoutes(
      userPage({ aboutHtml: '<p>Lớp 11 chuyên Tin.</p>', rank: 1203, ratingRank: 1134 }),
    ),
  });
  const { wrapper } = await mountApp('/users/user_01');
  expect(wrapper.find('svg[aria-label^="Biểu đồ rating qua"]').exists()).toBe(true);
  expect(wrapper.find('svg[aria-label="Biểu đồ hoạt động nộp bài 53 tuần"]').exists()).toBe(true);
  expect(wrapper.get('[data-testid="profile-stats"]').text()).toContain('#1.203');
  expect(wrapper.text()).toContain('Lớp 11 chuyên Tin.');
});

it('shows the sleeping Bit and a link to upcoming contests for an unrated user', async () => {
  const unrated = userPage({ rating: null, ratingRank: null, ratingSummary: null });
  mockApi({
    ...anonymousViewer,
    ...profileRoutes(unrated),
    'GET /users/user_01/ratings': ok([]),
  });
  const { wrapper } = await mountApp('/users/user_01');
  const state = wrapper.get('[data-state="empty"]');
  expect(state.text()).toContain('Chưa có kỳ thi tính rating');
  expect(state.get('a').attributes('href')).toBe('/contests?phase=upcoming');
});

it('writes a hidden contest as "Kỳ thi bạn không được xem" with dashes for rating and performance', async () => {
  mockApi({
    ...anonymousViewer,
    ...profileRoutes(),
    'GET /users/user_01/ratings': ok([
      {
        contestKey: null,
        contestName: null,
        endTime: '2026-09-01T10:00:00Z',
        rating: null,
        rank: null,
        performance: null,
      },
    ]),
  });
  const { wrapper } = await mountApp('/users/user_01');
  expect(wrapper.get('[data-testid="recent-contests"]').text()).toContain(
    'Kỳ thi bạn không được xem',
  );
});

it('fills the overview with blocks shaped like its cards while loading', async () => {
  mockApi({ ...anonymousViewer });
  hangRequestsExcept(['/auth/me']);
  const { wrapper } = await mountApp('/users/user_01');
  for (const region of ['header', 'rating', 'tabs']) {
    expect(wrapper.find(`[data-skeleton-region="${region}"]`).exists(), region).toBe(true);
  }
  for (const skeleton of wrapper.findAll('[data-testid="query-skeleton"]')) {
    expect(skeleton.text().trim()).toBe('');
  }
});
