import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMemoryHistory } from 'vue-router';
import { mockApi } from '@/test/mock-api';
import { anonymousViewer } from '@/test/problem-routes';
import { createAppRouter } from './index';

beforeEach(() => {
  setActivePinia(createPinia());
  mockApi({ ...anonymousViewer });
});
const resolve = (path: string) => createAppRouter(createMemoryHistory()).resolve(path);
/** Redirect records apply on navigation, not on `resolve`. */
const landOn = async (path: string) => {
  const router = createAppRouter(createMemoryHistory());
  await router.push(path);
  return router.currentRoute.value;
};

describe('8e routes', () => {
  it('keeps the legacy links of mails, Discord and feeds working, hash included', async () => {
    const post = await landOn('/post/p-1#comment-c-9');
    expect([post.name, post.params.id, post.hash]).toEqual(['post', 'p-1', '#comment-c-9']);
    expect((await landOn('/user/ngoc_anh')).name).toBe('user');
    expect((await landOn('/problem/aplusb/editorial')).query).toEqual({ tab: 'editorial' });
  }, 30_000); // the first navigation of the file pays for the lazy page imports
  it('sends a signed-out visitor of a legacy ticket link to sign in, then to the ticket', async () => {
    const landed = await landOn('/ticket/t-1');
    expect([landed.name, landed.query.redirect]).toEqual(['login', '/tickets/t-1']);
  });
  it('tries a stored page on an unknown path, and keeps the not-found record by name', () => {
    expect(resolve('/about/rules').name).toBe('flatpage');
    expect(resolve('/about/rules').params.pathMatch).toEqual(['about', 'rules']);
    expect(resolve('/problems').name).toBe('problems');
    const router = createAppRouter(createMemoryHistory());
    expect(router.resolve({ name: 'not-found', params: { pathMatch: ['x'] } }).name).toBe(
      'not-found',
    );
  });
});
