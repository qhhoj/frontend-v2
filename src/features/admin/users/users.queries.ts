import { useQuery } from '@tanstack/vue-query';
import type { QueryClient } from '@tanstack/vue-query';
import { computed } from 'vue';
import { fetchStaffUsers, fetchUserForEdit } from '@/api/users-admin.api';
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

/** The editable fields of one user, for the staff edit dialog. */
export const useUserEditQuery = (username: () => string) => {
  const viewer = useViewerId();
  return useQuery({
    queryKey: computed(() => ['admin', 'users', 'edit', username(), viewer.value]),
    queryFn: () => fetchUserForEdit(username()),
  });
};

/** A ban or an unban changes the staff list, the opened account's page and the public board. */
export const invalidateUserModeration = (queryClient: QueryClient, username: string) =>
  Promise.all([
    queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
    queryClient.invalidateQueries({ queryKey: ['users', 'page', username] }),
    queryClient.invalidateQueries({ queryKey: ['users', 'board'] }),
  ]);
