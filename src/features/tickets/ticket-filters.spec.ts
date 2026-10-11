import { describe, expect, it } from 'vitest';
import { parseUsernames, routeQueryFromFilters, ticketQueryFromRoute } from './ticket-filters';

describe('ticket filters: parsing', () => {
  it('reads usernames separated by commas or spaces, once each, at most ten', () => {
    expect(parseUsernames(' colan, thayhung  colan,,')).toEqual(['colan', 'thayhung']);
    expect(
      parseUsernames(Array.from({ length: 12 }, (_name, index) => `u${index}`).join(',')),
    ).toHaveLength(10);
  });
  it('lists the viewer’s own tickets unless the URL asks for all they can see', () => {
    expect(ticketQueryFromRoute({})).toEqual({
      own: true,
      open: undefined,
      user: [],
      assignee: [],
      page: 1,
    });
    expect(ticketQueryFromRoute({ scope: 'all', open: '1', user: 'a,b', page: '3' })).toEqual({
      own: false,
      open: true,
      user: ['a', 'b'],
      assignee: [],
      page: 3,
    });
  });
  it('reads open=0 as closed tickets and any other open value as both', () => {
    expect(ticketQueryFromRoute({ open: '0' }).open).toBe(false);
    expect(ticketQueryFromRoute({ open: 'yes' }).open).toBeUndefined();
  });
});

describe('ticket filters: URL round trip', () => {
  it('round-trips the closed filter through the URL', () => {
    const filters = { own: false, open: false, user: [], assignee: [], page: 1 };
    expect(routeQueryFromFilters(filters)).toEqual({ scope: 'all', open: '0' });
    expect(ticketQueryFromRoute(routeQueryFromFilters(filters) as Record<string, string>)).toEqual(
      filters,
    );
  });
});
