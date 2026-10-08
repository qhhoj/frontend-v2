import { keepPreviousData, useQuery } from '@tanstack/vue-query';
import { computed, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import {
  fetchJoinRequest,
  fetchJoinRequests,
  fetchMembers,
  fetchOrganization,
  fetchOrganizationPosts,
  fetchOrganizations,
} from '@/api/organizations.api';
import type { JoinRequestState, MemberSort } from '@/api/types/organizations';
import { useViewerId } from '@/stores/use-viewer-id';

export const useOrganizationsQuery = (page: MaybeRefOrGetter<number>) => {
  const viewer = useViewerId();
  return useQuery({
    queryKey: computed(() => ['organizations', 'list', toValue(page), viewer.value]),
    queryFn: () => fetchOrganizations(toValue(page)),
    placeholderData: keepPreviousData,
  });
};

export const useOrganizationQuery = (slug: MaybeRefOrGetter<string>) => {
  const viewer = useViewerId();
  return useQuery({
    queryKey: computed(() => ['organizations', 'detail', toValue(slug), viewer.value]),
    queryFn: () => fetchOrganization(toValue(slug)),
  });
};

export interface MemberListOptions {
  sort: MemberSort;
  page: number;
  pageSize: number;
}
export const useMembersQuery = (
  slug: MaybeRefOrGetter<string>,
  options: MaybeRefOrGetter<MemberListOptions>,
) =>
  useQuery({
    queryKey: computed(() => ['organizations', 'members', toValue(slug), { ...toValue(options) }]),
    queryFn: () => fetchMembers(toValue(slug), toValue(options)),
    placeholderData: keepPreviousData,
  });

export const useOrganizationPostsQuery = (
  slug: MaybeRefOrGetter<string>,
  page: MaybeRefOrGetter<number>,
) => {
  const viewer = useViewerId();
  return useQuery({
    queryKey: computed(() => [
      'organizations',
      'posts',
      toValue(slug),
      toValue(page),
      viewer.value,
    ]),
    queryFn: () => fetchOrganizationPosts(toValue(slug), toValue(page)),
    placeholderData: keepPreviousData,
  });
};

export const useJoinRequestsQuery = (
  slug: MaybeRefOrGetter<string>,
  state: MaybeRefOrGetter<JoinRequestState>,
  page: MaybeRefOrGetter<number>,
  isEnabled: MaybeRefOrGetter<boolean>,
) =>
  useQuery({
    queryKey: computed(() => [
      'organizations',
      'requests',
      toValue(slug),
      toValue(state),
      toValue(page),
    ]),
    queryFn: () => fetchJoinRequests(toValue(slug), toValue(state), toValue(page)),
    placeholderData: keepPreviousData,
    enabled: computed(() => toValue(isEnabled)),
  });

/** The viewer's own pending request; idle when there is none. */
export const usePendingRequestQuery = (
  slug: MaybeRefOrGetter<string>,
  id: MaybeRefOrGetter<string | null>,
) =>
  useQuery({
    queryKey: computed(() => ['organizations', 'request', toValue(slug), toValue(id)]),
    queryFn: () => fetchJoinRequest(toValue(slug), toValue(id) as string),
    enabled: computed(() => toValue(id) !== null),
  });
