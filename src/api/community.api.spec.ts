import { describe, expect, it } from 'vitest';
import { commentThreadPage, ticketDetail } from '@/test/community-fixtures';
import { mockApi, noContent, ok, page } from '@/test/mock-api';
import { fetchCommentPage, postComment } from './comments.api';
import { fetchTickets, updateTicket } from './tickets.api';
import { fetchFlatpage } from './flatpages.api';
import { fetchRank, fetchUserComments } from './users.api';
import { joinOrganization } from './organizations.api';

describe('comment calls', () => {
  it('asks a comment page by type, encoded key and page number', async () => {
    const calls = mockApi({ 'GET /comments/pages/blog/a%2Fb': ok(commentThreadPage()) });
    await fetchCommentPage('blog', 'a/b', 3);
    expect(calls[0]!.path).toBe('/comments/pages/blog/a%2Fb');
    expect(calls[0]!.query.get('page')).toBe('3');
  });
  it('posts a reply with its parent and a root comment without one', async () => {
    const calls = mockApi({ 'POST /comments/pages/blog/p-1': ok(commentThreadPage().comments[0]) });
    await postComment('blog', 'p-1', { body: 'hi', parentId: 'c-1' });
    await postComment('blog', 'p-1', { body: 'root' });
    expect(calls.map((call) => call.body)).toEqual([
      { body: 'hi', parentId: 'c-1' },
      { body: 'root' },
    ]);
  });
});

describe('ticket and flatpage calls', () => {
  it('repeats user and assignee and leaves an unset open filter out', async () => {
    const calls = mockApi({ 'GET /tickets': page([]) });
    await fetchTickets({ own: false, open: undefined, user: ['a', 'b'], assignee: [], page: 2 });
    expect(calls[0]!.query.getAll('user')).toEqual(['a', 'b']);
    expect(calls[0]!.query.has('open')).toBe(false);
    expect(calls[0]!.query.get('own')).toBe('false');
  });
  it('asks for the closed tickets with open=false, not for no filter', async () => {
    const calls = mockApi({ 'GET /tickets': page([]) });
    await fetchTickets({ own: false, open: false, user: [], assignee: [], page: 1 });
    expect(calls[0]!.query.get('open')).toBe('false');
  });
  it('patches only the ticket fields it is given', async () => {
    const calls = mockApi({ 'PATCH /tickets/t-1': ok(ticketDetail()) });
    await updateTicket('t-1', { isOpen: false });
    expect(calls[0]!.body).toEqual({ isOpen: false });
  });
  it('keeps the slashes of a nested flatpage path and encodes each segment', async () => {
    const calls = mockApi({
      'GET /pages/about/r%C3%A8gles': ok({
        url: '/about/règles',
        title: 'R',
        contentHtml: '',
        registrationRequired: false,
      }),
    });
    const flatpage = await fetchFlatpage('about/règles');
    expect(calls[0]!.path).toBe('/pages/about/r%C3%A8gles');
    expect(flatpage.url).toBe('/about/règles');
  });
});

describe('user and organization calls', () => {
  it('sends the comment cursor only when there is one and asks the rank for a field', async () => {
    const calls = mockApi({
      'GET /users/user_01/comments': page([], { nextBefore: null }),
      'GET /users/user_01/rank': ok({ rank: 7, page: 1, pageSize: 100 }),
    });
    await fetchUserComments('user_01');
    await fetchUserComments('user_01', '0192a000-0000-7000-8000-00000000c0aa');
    await fetchRank('user_01', 'contributionPoints');
    expect(calls.map((call) => call.query.toString())).toEqual([
      '',
      'before=0192a000-0000-7000-8000-00000000c0aa',
      'sort=contributionPoints',
    ]);
  });
  it('joins with an empty POST that answers 204', async () => {
    const calls = mockApi({ 'POST /organizations/lhp/join': noContent() });
    await expect(joinOrganization('lhp')).resolves.toBeUndefined();
    expect(calls[0]!.method).toBe('POST');
  });
});
