import { QueryClient } from '@tanstack/vue-query';
import { describe, expect, it } from 'vitest';
import { invalidateCommentPage } from './comments.queries';

const seeded = (keys: unknown[][]) => {
  const client = new QueryClient();
  for (const key of keys) client.setQueryData(key, 'cached');
  return client;
};
const invalidated = (client: QueryClient, key: unknown[]) =>
  client.getQueryState(key)?.isInvalidated ?? false;

describe('invalidateCommentPage', () => {
  it('refreshes every page number of that comment page, the home feed and a blog post’s comment count', async () => {
    const client = seeded([
      ['comments', 'page', 'blog', 'p1', 1, 'anonymous'],
      ['comments', 'page', 'blog', 'p1', 2, 'u1'],
      ['comments', 'page', 'blog', 'p2', 1, 'u1'],
      ['comments', 'page', 'problem', 'p1', 1, 'u1'],
      ['posts', 'detail', 'p1', 'u1'],
      ['home', 'u1'],
    ]);
    await invalidateCommentPage(client, 'blog', 'p1');
    expect(invalidated(client, ['comments', 'page', 'blog', 'p1', 1, 'anonymous'])).toBe(true);
    expect(invalidated(client, ['comments', 'page', 'blog', 'p1', 2, 'u1'])).toBe(true);
    expect(invalidated(client, ['posts', 'detail', 'p1', 'u1'])).toBe(true);
    expect(invalidated(client, ['home', 'u1'])).toBe(true);
    expect(invalidated(client, ['comments', 'page', 'blog', 'p2', 1, 'u1'])).toBe(false);
    expect(invalidated(client, ['comments', 'page', 'problem', 'p1', 1, 'u1'])).toBe(false);
  });

  it('leaves posts alone for a problem page and drops an edited comment’s cached history', async () => {
    const client = seeded([
      ['posts', 'detail', 'p1', 'u1'],
      ['comments', 'revisions', 'c1'],
      ['comments', 'revisions', 'c2'],
    ]);
    await invalidateCommentPage(client, 'problem', 'aplusb', 'c1');
    expect(invalidated(client, ['posts', 'detail', 'p1', 'u1'])).toBe(false);
    expect(invalidated(client, ['comments', 'revisions', 'c1'])).toBe(true);
    expect(invalidated(client, ['comments', 'revisions', 'c2'])).toBe(false);
  });
});
