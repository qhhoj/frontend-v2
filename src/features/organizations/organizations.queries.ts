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
import { keepPreviousForViewer } from '@/features/contests/keep-previous-for-viewer';

/** The search term joins the key only when it is set, so the plain list keeps its key. */
export const useOrganizationsQuery = (
  page: MaybeRefOrGetter<number>,
  search?: MaybeRefOrGetter<string | undefined>,
  enabled: MaybeRefOrGetter<boolean> = true,
) => {
  const viewer = useViewerId();
  const term = () => (search === undefined ? '' : (toValue(search) ?? '').trim());
  return useQuery({
    queryKey: computed(() => [
      'organizations',
      'list',
      toValue(page),
      viewer.value,
      ...(term() ? [term()] : []),
    ]),
    queryFn: () => fetchOrganizations(toValue(page), term()),
    placeholderData: computed(() => keepPreviousForViewer(viewer.value)),
    enabled: () => toValue(enabled),
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
  /** Username substring; ranks then count the matches only. */
  search?: string;
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
    placeholderData: computed(() => keepPreviousForViewer(viewer.value)),
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
