import { expect, it } from 'vitest';
import { profileRoutes } from '@/test/community-routes';
import { mockApi, ok } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { anonymousViewer } from '@/test/problem-routes';

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
