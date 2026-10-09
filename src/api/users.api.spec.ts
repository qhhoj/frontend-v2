import { describe, expect, it } from 'vitest';
import { leaderboardEntry, userPage } from '@/test/fixtures';
import { mockApi, noContent, ok, page } from '@/test/mock-api';
import * as users from './users.api';

describe('user page calls', () => {
  it('reads the page, ratings and solved list of a name, encoded into one segment', async () => {
    const calls = mockApi({
      'GET /users/a%2Fb': ok(userPage({ username: 'a/b' })),
      'GET /users/a%2Fb/ratings': ok([]),
      'GET /users/a%2Fb/solved': ok({ groups: [] }),
    });
    await users.fetchUserPage('a/b');
    await users.fetchRatingHistory('a/b');
    await users.fetchSolved('a/b');
    expect(calls.map((call) => `${call.method} ${call.path}`)).toEqual([
      'GET /users/a%2Fb',
      'GET /users/a%2Fb/ratings',
      'GET /users/a%2Fb/solved',
    ]);
  });

  it('asks for the rank by the chosen sort field', async () => {
    const calls = mockApi({ 'GET /users/ada/rank': ok({ rank: 1, page: 1, pageSize: 100 }) });
    await users.fetchRank('ada', 'contributionPoints');
    expect(calls[0]!.query.get('sort')).toBe('contributionPoints');
  });

  it('asks for the activity in a time zone', async () => {
    const calls = mockApi({
      'GET /users/ada/activity': ok({ timezone: 'UTC', since: '2026-01-01', days: {} }),
    });
    await users.fetchActivity('ada', 'Asia/Ho_Chi_Minh');
    expect(calls[0]!.path).toBe('/users/ada/activity');
    expect(calls[0]!.query.get('timezone')).toBe('Asia/Ho_Chi_Minh');
  });

  it('pages the pp breakdown, posts and comments of a user', async () => {
    const calls = mockApi({
      'GET /users/ada/pp-breakdown': page([]),
      'GET /users/ada/blog': page([]),
      'GET /users/ada/comments': page([]),
    });
    await users.fetchPpBreakdown('ada', 3);
    await users.fetchUserPosts('ada', 2);
    await users.fetchUserComments('ada', 'c-9');
    expect(calls[0]!.query.get('page')).toBe('3');
    expect(calls[1]!.query.get('page')).toBe('2');
    expect(calls[2]!.query.get('before')).toBe('c-9');
  });

  it('leaves out the keyset cursor on the first page of comments', async () => {
    const calls = mockApi({ 'GET /users/ada/comments': page([]) });
    await users.fetchUserComments('ada');
    expect(calls[0]!.query.has('before')).toBe(false);
  });
});

describe('leaderboard calls', () => {
  it('sends the sort and page of the board query', async () => {
    const calls = mockApi({ 'GET /users': page([leaderboardEntry(1, 'ada', 1500)]) });
    await users.fetchLeaderboard({ sort: 'rating', page: 2, pageSize: 100 });
    expect(calls[0]!.query.get('sort')).toBe('rating');
    expect(calls[0]!.query.get('page')).toBe('2');
    expect(calls[0]!.query.get('pageSize')).toBe('100');
  });

  it('reads contributors at the board page size', async () => {
    const calls = mockApi({ 'GET /contributors': page([leaderboardEntry(1, 'ada', 1500)]) });
    await users.fetchContributors(4);
    expect(calls[0]!.query.get('page')).toBe('4');
    expect(calls[0]!.query.get('pageSize')).toBe('100');
  });
});

describe('banUser', () => {
  it('posts the reason to the ban route of the name', async () => {
    const calls = mockApi({ 'POST /users/a%2Fb/ban': noContent() });
    await expect(users.banUser('a/b', 'spam')).resolves.toBeUndefined();
    expect(calls[0]!.body).toEqual({ reason: 'spam' });
  });
});
