import { describe, expect, it } from 'vitest';
import { postItem } from '@/test/community-fixtures';
import { blogListRoutes, communityHomeRoutes } from '@/test/community-routes';
import { mockApi, page } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { anonymousViewer } from '@/test/problem-routes';

const author = (username: string, rating: number | null) => ({
  id: `id-${username}`,
  username,
  rating,
});

describe('usernames take the colour of the rating tier', () => {
  it('post authors in the blog list, by tier (2450 grandmaster, 1650 expert, unrated none)', async () => {
    mockApi({
      ...anonymousViewer,
      ...communityHomeRoutes,
      ...blogListRoutes,
      'GET /posts': page([
        postItem({ id: 'p1', authors: [author('gm', 2450)] }),
        postItem({ id: 'p2', authors: [author('sp', 1650)] }),
        postItem({ id: 'p3', authors: [author('un', null)] }),
      ]),
    });
    const { wrapper } = await mountApp('/blog');
    const classesOf = (name: string) =>
      wrapper
        .findAll('[data-testid="post-row"] a')
        .find((link) => link.text() === name)!
        .classes();
    expect(classesOf('gm')).toContain('text-tier-grandmaster');
    expect(classesOf('sp')).toContain('text-tier-expert');
    expect(classesOf('un')).toContain('text-tier-none');
  });
});
