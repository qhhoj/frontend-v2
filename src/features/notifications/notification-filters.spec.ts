import { describe, expect, it } from 'vitest';
import { filterLink, kindGroupFromQuery, stateFromQuery } from './notification-filters';

describe('notification filters', () => {
  it('reads the state from the address and falls back to all', () => {
    expect(stateFromQuery('unread')).toBe('unread');
    expect(stateFromQuery(['read', 'unread'])).toBe('read');
    expect(stateFromQuery('archived')).toBe('all');
    expect(stateFromQuery(undefined)).toBe('all');
  });

  it('writes all as the bare page and drops the page number on a filter change', () => {
    expect(filterLink('all')).toEqual({ name: 'notifications', query: {} });
    expect(filterLink('read')).toEqual({ name: 'notifications', query: { state: 'read' } });
  });

  it('keeps the kind chip when the state changes and the state when the kind changes', () => {
    expect(filterLink('unread', 'organization')).toEqual({
      name: 'notifications',
      query: { state: 'unread', kind: 'organization' },
    });
    expect(filterLink('all', 'contest')).toEqual({
      name: 'notifications',
      query: { kind: 'contest' },
    });
  });

  it('reads the kind chip from the address and ignores anything else', () => {
    expect(kindGroupFromQuery('contest')).toBe('contest');
    expect(kindGroupFromQuery(['ticket', 'other'])).toBe('ticket');
    // The "other" chip has no backend kind yet (N1-01): it is no filter, not "everything".
    expect(kindGroupFromQuery('other')).toBeNull();
    expect(kindGroupFromQuery('quota-warning')).toBeNull();
    expect(kindGroupFromQuery(undefined)).toBeNull();
  });
});
