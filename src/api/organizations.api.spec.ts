import { describe, expect, it } from 'vitest';
import { joinRequest, member, organizationDetail, postItem } from '@/test/community-fixtures';
import { organizationItem } from '@/test/fixtures';
import { mockApi, noContent, ok, page } from '@/test/mock-api';
import {
  decideJoinRequest,
  fetchJoinRequest,
  fetchJoinRequests,
  fetchMembers,
  fetchOpenOrganizations,
  fetchOrganization,
  fetchOrganizationPosts,
  fetchOrganizations,
  leaveOrganization,
  requestToJoin,
} from './organizations.api';

describe('fetchOpenOrganizations', () => {
  it('keeps the organizations a signup may join: open and listed', async () => {
    mockApi({
      'GET /organizations': page([
        organizationItem({ slug: 'open', name: 'Open' }),
        organizationItem({ slug: 'closed', name: 'Closed', isOpen: false }),
        organizationItem({ slug: 'hidden', name: 'Hidden', isUnlisted: true }),
      ]),
    });
    expect((await fetchOpenOrganizations()).map((organization) => organization.slug)).toEqual([
      'open',
    ]);
  });

  it('reads every page the backend has, at the largest page size, in its order', async () => {
    const calls = mockApi({
      'GET /organizations': (call) => {
        const pageNumber = Number(call.query.get('page'));
        return page([organizationItem({ slug: `school-${pageNumber}` })], {
          page: pageNumber,
          pageSize: 100,
          total: 150,
        });
      },
    });
    const schools = await fetchOpenOrganizations();
    expect(schools.map((organization) => organization.slug)).toEqual(['school-1', 'school-2']);
    expect(calls.map((call) => [call.query.get('page'), call.query.get('pageSize')])).toEqual([
      ['1', '100'],
      ['2', '100'],
    ]);
  });
});

describe('organization calls', () => {
  it('trims the search and sends nothing for a blank one', async () => {
    const calls = mockApi({ 'GET /organizations': page([]) });
    await fetchOrganizations(1, '  lhp ');
    await fetchOrganizations(1, '   ');
    expect(calls[0]!.query.get('search')).toBe('lhp');
    expect(calls[1]!.query.has('search')).toBe(false);
  });
  it('reads an organization, its members and its posts by the encoded slug', async () => {
    const calls = mockApi({
      'GET /organizations/a%2Fb': ok(organizationDetail()),
      'GET /organizations/a%2Fb/members': page([member(1, 'user_01')]),
      'GET /organizations/a%2Fb/posts': page([postItem()]),
    });
    await fetchOrganization('a/b');
    await fetchMembers('a/b', { sort: 'rating', page: 2, pageSize: 25 });
    await fetchOrganizationPosts('a/b', 3);
    expect(calls[1]!.query.toString()).toBe('sort=rating&page=2&pageSize=25');
    expect(calls[2]!.query.get('page')).toBe('3');
  });
  it('leaves with an empty POST and asks to join with the reason as the body', async () => {
    const calls = mockApi({
      'POST /organizations/lhp/leave': noContent(),
      'POST /organizations/lhp/requests': ok(joinRequest()),
    });
    await leaveOrganization('lhp');
    await requestToJoin('lhp', 'please');
    expect(calls.map((call) => call.body)).toEqual([undefined, { reason: 'please' }]);
  });
  it('reads, lists and decides join requests on their routes', async () => {
    const calls = mockApi({
      'GET /organizations/lhp/requests/r%2F1': ok(joinRequest()),
      'GET /organizations/lhp/requests': page([joinRequest()]),
      'POST /organizations/lhp/requests/r%2F1/decide': ok(joinRequest()),
    });
    await fetchJoinRequest('lhp', 'r/1');
    await fetchJoinRequests('lhp', 'P', 2);
    await decideJoinRequest('lhp', 'r/1', 'A');
    expect(calls[1]!.query.toString()).toBe('state=P&page=2');
    expect(calls[2]!.body).toEqual({ state: 'A' });
  });
});
