import { expect, it } from 'vitest';
import { userPage } from '@/test/fixtures';
import { profileRoutes } from '@/test/community-routes';
import { hangRequestsExcept, mockApi } from '@/test/mock-api';
import { mountApp, mountComponent } from '@/test/mount';
import { anonymousViewer } from '@/test/problem-routes';
import ProfileOverviewSkeleton from './ProfileOverviewSkeleton.vue';

/** Literal expectations, so a drifting class fails here and not as a silent layout shift at 375 px. */
const RATING_BOX = 'flex min-h-[158px] flex-col gap-2 rounded-tile border border-line p-5';

it('the loaded rating box at 375 px is 158 px tall: the literal class string', async () => {
  mockApi({ ...anonymousViewer, ...profileRoutes(userPage({ organizations: [] })) });
  const { wrapper } = await mountApp('/users/user_01');
  expect(wrapper.get('[data-testid="rating-box"]').attributes('class')).toBe(RATING_BOX);
});

it('the rating box of the skeleton is the same 158 px box, with 20, 40 and 40 px lines inside', async () => {
  mockApi({ ...anonymousViewer });
  hangRequestsExcept(['/auth/me']);
  const { wrapper } = await mountApp('/users/user_01');
  const box = wrapper.get('[data-skeleton-region="rating"] [data-testid="rating-box"]');
  expect(box.attributes('class')).toBe(RATING_BOX);
  const lines = box.findAll('[data-skeleton]').map((block) => block.attributes('class'));
  expect(lines[0]).toContain('h-5 w-16');
  expect(lines[1]).toContain('h-10 w-24');
  expect(lines[2]).toContain('h-10 w-56');
});

it('the header skeleton draws the common shape: avatar, tier pill, name and joined line, no chips or actions', async () => {
  mockApi({ ...anonymousViewer });
  hangRequestsExcept(['/auth/me']);
  const { wrapper } = await mountApp('/users/user_01');
  const blocks = wrapper.findAll('[data-skeleton-region="header"] [data-skeleton]');
  expect(blocks).toHaveLength(4);
  expect(blocks[0]!.attributes('class')).toContain('size-24');
  expect(blocks[1]!.attributes('class')).toContain('h-[26px] w-24');
  expect(blocks[2]!.attributes('class')).toContain('h-[30px] w-56');
  expect(blocks[3]!.attributes('class')).toContain('h-6 w-64');
});

it('the contests skeleton is a card of 36 px header, five 37 px table rows, and five 61 px list rows on a phone', () => {
  const wrapper = mountComponent(ProfileOverviewSkeleton, { props: { part: 'contests' } });
  const blocks = wrapper.findAll('[data-skeleton]').map((block) => block.attributes('class'));
  expect(blocks[0]).toContain('h-7 w-40');
  expect(blocks[1]).toContain('h-9');
  for (const row of blocks.slice(2, 7)) expect(row).toContain('h-[37px]');
  for (const row of blocks.slice(7, 12)) expect(row).toContain('h-[61px]');
  expect(blocks).toHaveLength(12);
});
