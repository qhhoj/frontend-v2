import type { LocationQuery } from 'vue-router';
import type { OrganizationListFilters } from '@/api/organizations-admin.api';
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

/** `?open=1|0` and `?unlisted=1|0`; anything else is no filter. */
const flagOf = (value: LocationQuery[string] | undefined): boolean | undefined => {
  const text = first(value);
  return text === '1' ? true : text === '0' ? false : undefined;
};

export const organizationFiltersOf = (query: LocationQuery): OrganizationListFilters => {
  const filters: OrganizationListFilters = {};
  const open = flagOf(query.open);
  const unlisted = flagOf(query.unlisted);
  if (open !== undefined) filters.open = open;
  if (unlisted !== undefined) filters.unlisted = unlisted;
  return filters;
};

/** The backend's `Length(1, 64)` on the member and request-queue `search`. */
export const USERNAME_SEARCH_MAX_LENGTH = 64;
const boundedSearch = (value: LocationQuery[string] | undefined) =>
  first(value).trim().slice(0, USERNAME_SEARCH_MAX_LENGTH);

/** The request queue's `?q=` search. */
export const requestSearchOf = (query: LocationQuery): string => boundedSearch(query.q);
/** The member panel's `?mq=` search (its own key: the organization list owns `q`). */
export const memberSearchOf = (query: LocationQuery): string => boundedSearch(query.mq);

/** Query keys that describe one organization's panels; opening another organization drops them. */
export const PER_ORGANIZATION_RESET = {
  mq: undefined,
  members: undefined,
  requests: undefined,
  history: undefined,
} as const;
