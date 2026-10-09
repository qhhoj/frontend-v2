import type { LocationQuery } from 'vue-router';
import type { JoinRequestState } from '@/api/types/organizations';

/** The backend's `Length(1, 50)` on the organization `search`. */
export const ORGANIZATION_SEARCH_MAX_LENGTH = 50;
export type OrganizationsView = 'organizations' | 'requests';

const first = (value: LocationQuery[string] | undefined) =>
  (Array.isArray(value) ? value[0] : value) ?? '';

/** The request queue is a page of its own; a viewer who may not read it always gets the organizations tab. */
export const organizationsViewOf = (
  query: LocationQuery,
  canSeeQueue: boolean,
): OrganizationsView =>
  canSeeQueue && first(query.view) === 'requests' ? 'requests' : 'organizations';

export const requestStateOf = (query: LocationQuery): JoinRequestState => {
  const state = first(query.state);
  return state === 'A' || state === 'R' ? state : 'P';
};

export const organizationSearchOf = (query: LocationQuery): string =>
  first(query.q).trim().slice(0, ORGANIZATION_SEARCH_MAX_LENGTH);
