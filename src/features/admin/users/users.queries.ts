import { useQuery } from '@tanstack/vue-query';
import type { QueryClient } from '@tanstack/vue-query';
import { computed, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import {
  fetchPermissionCatalog,
  fetchRoles,
  fetchStaffUsers,
  fetchUserAccess,
  fetchUserForEdit,
} from '@/api/users-admin.api';
import type { StaffUserQuery } from '@/api/types/users-admin';
import { useViewerId } from '@/stores/use-viewer-id';

/** The staff user list for one query; the key holds the query, so each page and filter is its own cache entry. */
export const useStaffUsersQuery = (query: () => StaffUserQuery) => {
  const viewer = useViewerId();
  return useQuery({
    queryKey: computed(() => ['admin', 'users', query(), viewer.value]),
    queryFn: () => fetchStaffUsers(query()),
  });
};

/** The editable fields of one user, for the staff edit drawer; loaded only while `enabled` (the viewer may edit). */
export const useUserEditQuery = (
  username: () => string,
  enabled: MaybeRefOrGetter<boolean> = true,
) => {
  const viewer = useViewerId();
  return useQuery({
    queryKey: computed(() => ['admin', 'users', 'edit', username(), viewer.value]),
    queryFn: () => fetchUserForEdit(username()),
    enabled: computed(() => toValue(enabled)),
  });
};

/** The permission catalog: fixed per deploy, so cached for the session. */
export const usePermissionCatalogQuery = () => {
  const viewer = useViewerId();
  return useQuery({
    queryKey: computed(() => ['admin', 'access', 'catalog', viewer.value]),
    queryFn: fetchPermissionCatalog,
    staleTime: Infinity,
  });
};

/** Every role with its permissions and member count. */
export const useRolesQuery = () => {
  const viewer = useViewerId();
  return useQuery({
    queryKey: computed(() => ['admin', 'access', 'roles', viewer.value]),
    queryFn: fetchRoles,
  });
};

/** One user's roles, flags and permissions. */
export const useUserAccessQuery = (username: () => string) => {
  const viewer = useViewerId();
  return useQuery({
    queryKey: computed(() => ['admin', 'access', 'user', username(), viewer.value]),
    queryFn: () => fetchUserAccess(username()),
  });
};

/** A ban or an unban changes the staff list, the opened account's page and the public board. */
export const invalidateUserModeration = (queryClient: QueryClient, username: string) =>
  Promise.all([
    queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
    queryClient.invalidateQueries({ queryKey: ['users', 'page', username] }),
    queryClient.invalidateQueries({ queryKey: ['users', 'board'] }),
  ]);
