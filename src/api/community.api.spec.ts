import { describe, expect, it } from 'vitest';
import {
  commentDetail,
  commentRevision,
  commentThreadPage,
  ticketDetail,
  ticketMessage,
} from '@/test/community-fixtures';
import { mockApi, noContent, ok, page } from '@/test/mock-api';
import {
  editComment,
  fetchComment,
  fetchCommentPage,
  fetchCommentVotes,
  fetchRevisions,
  lockCommentPage,
  postComment,
  setCommentHidden,
  unlockCommentPage,
  voteComment,
} from './comments.api';
import {
  createGeneralTicket,
  createProblemTicket,
  fetchTicket,
  fetchTickets,
  postTicketMessage,
  updateTicket,
} from './tickets.api';
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

describe('comment moderation and voting calls', () => {
  it('reads, edits, votes, hides and lists a comment by its encoded id', async () => {
    const calls = mockApi({
      'GET /comments/c%2F1': ok(commentDetail()),
      'PATCH /comments/c%2F1': ok(commentDetail()),
      'GET /comments/c%2F1/revisions': ok([commentRevision()]),
      'PUT /comments/c%2F1/vote': ok({ score: 1, viewerVote: -1 }),
      'POST /comments/c%2F1/hidden': ok(commentDetail()),
      'GET /comments/c%2F1/votes': ok([]),
    });
    await fetchComment('c/1');
    await editComment('c/1', 'new');
    await fetchRevisions('c/1');
    await voteComment('c/1', -1);
    await setCommentHidden('c/1', true);
    await fetchCommentVotes('c/1');
    expect(calls.map((call) => `${call.method} ${call.path}`)).toEqual([
      'GET /comments/c%2F1',
      'PATCH /comments/c%2F1',
      'GET /comments/c%2F1/revisions',
      'PUT /comments/c%2F1/vote',
      'POST /comments/c%2F1/hidden',
      'GET /comments/c%2F1/votes',
    ]);
    expect(calls.map((call) => call.body)).toEqual([
      undefined,
      { body: 'new' },
      undefined,
      { score: -1 },
      { hidden: true },
      undefined,
    ]);
  });
  it('locks with PUT and unlocks with DELETE on the same page route', async () => {
    const calls = mockApi({
      'PUT /comments/pages/blog/p-1/lock': noContent(),
      'DELETE /comments/pages/blog/p-1/lock': noContent(),
    });
    await lockCommentPage('blog', 'p-1');
    await unlockCommentPage('blog', 'p-1');
    expect(calls.map((call) => `${call.method} ${call.path}`)).toEqual([
      'PUT /comments/pages/blog/p-1/lock',
      'DELETE /comments/pages/blog/p-1/lock',
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
  it('reads, opens and answers tickets on their routes with the draft as the body', async () => {
    const calls = mockApi({
      'GET /tickets/t-1': ok(ticketDetail()),
      'POST /problems/a%2Fb/tickets': ok(ticketDetail()),
      'POST /tickets/general': ok(ticketDetail()),
      'POST /tickets/t-1/messages': ok(ticketMessage()),
    });
    await fetchTicket('t-1');
    await createProblemTicket('a/b', { title: 'T', body: 'B' });
    await createGeneralTicket({ title: 'T', body: 'B', issueUrl: 'https://x.test/1' });
    await postTicketMessage('t-1', 'hello');
    expect(calls.map((call) => `${call.method} ${call.path}`)).toEqual([
      'GET /tickets/t-1',
      'POST /problems/a%2Fb/tickets',
      'POST /tickets/general',
      'POST /tickets/t-1/messages',
    ]);
    expect(calls[2]!.body).toEqual({ title: 'T', body: 'B', issueUrl: 'https://x.test/1' });
    expect(calls[3]!.body).toEqual({ body: 'hello' });
  });
  it('encodes a nested flatpage path as one wildcard value the server decodes', async () => {
    const calls = mockApi({
      'GET /pages/about%2Fr%C3%A8gles': ok({
        url: '/about/règles',
        title: 'R',
        contentHtml: '',
        registrationRequired: false,
      }),
    });
    const flatpage = await fetchFlatpage('about/règles');
    expect(calls[0]!.path).toBe('/pages/about%2Fr%C3%A8gles');
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
