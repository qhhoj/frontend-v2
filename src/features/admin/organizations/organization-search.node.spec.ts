import { describe, expect, it } from 'vitest';
import {
  ORGANIZATION_SEARCH_MAX_LENGTH,
  organizationSearchOf,
  organizationsViewOf,
  requestStateOf,
} from './organization-search';

describe('organization search', () => {
  it('shows the request queue only to a viewer who may read it', () => {
    expect(organizationsViewOf({ view: 'requests' }, true)).toBe('requests');
    expect(organizationsViewOf({ view: 'requests' }, false)).toBe('organizations');
    expect(organizationsViewOf({ view: 'other' }, true)).toBe('organizations');
    expect(organizationsViewOf({}, true)).toBe('organizations');
  });

  it('reads the request state and a bounded, trimmed search from the URL', () => {
    expect(requestStateOf({ state: 'A' })).toBe('A');
    expect(requestStateOf({ state: 'R' })).toBe('R');
    expect(requestStateOf({ state: 'x' })).toBe('P');
    expect(requestStateOf({})).toBe('P');
    expect(organizationSearchOf({ q: '  cl ' })).toBe('cl');
    expect(organizationSearchOf({ q: 'x'.repeat(80) })).toHaveLength(
      ORGANIZATION_SEARCH_MAX_LENGTH,
    );
    expect(organizationSearchOf({})).toBe('');
  });
});
