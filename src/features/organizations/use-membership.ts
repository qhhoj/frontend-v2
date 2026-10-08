import { useMutation, useQueryClient } from '@tanstack/vue-query';
import { computed, ref, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import { joinOrganization, leaveOrganization, requestToJoin } from '@/api/organizations.api';
import type { MembershipAction } from './membership-errors';

interface MembershipCommand {
  kind: MembershipAction;
  reason?: string;
}

/** Join, leave and request; each refreshes the organization and the viewer's own organization list. */
export function useMembership(slug: MaybeRefOrGetter<string>) {
  const client = useQueryClient();
  const action = ref<MembershipAction | null>(null);
  const refresh = () =>
    Promise.all([
      client.invalidateQueries({ queryKey: ['organizations'] }),
      client.invalidateQueries({ queryKey: ['users', 'page'] }),
    ]);
  const runCommand = ({ kind, reason }: MembershipCommand) => {
    action.value = kind;
    if (kind === 'join') return joinOrganization(toValue(slug));
    if (kind === 'leave') return leaveOrganization(toValue(slug));
    return requestToJoin(toValue(slug), reason!.trim()).then(() => undefined);
  };
  const mutation = useMutation({ mutationFn: runCommand, onSuccess: refresh });
  return {
    join: () => mutation.mutate({ kind: 'join' }),
    leave: () => mutation.mutate({ kind: 'leave' }),
    request: (reason: string) => mutation.mutate({ kind: 'request', reason }),
    isPending: mutation.isPending,
    succeeded: computed(() => mutation.isSuccess.value),
    error: mutation.error,
    action,
  };
}
