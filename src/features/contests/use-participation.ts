import { useMutation, useQueryClient } from '@tanstack/vue-query';
import type { Ref } from 'vue';
import type { RulesAcceptance } from '@/api/contests.api';
import { joinContest, leaveContest, registerContest } from '@/api/contests.api';
import type { ParticipationCommand } from './contest-action';

interface Request {
  command: ParticipationCommand;
  accessCode?: string;
  acceptance?: RulesAcceptance;
}
const send = (key: string, { command, accessCode, acceptance }: Request): Promise<unknown> => {
  if (command === 'leave') return leaveContest(key);
  return command === 'register'
    ? registerContest(key, accessCode, acceptance)
    : joinContest(key, accessCode, acceptance);
};

/** Join, register or leave; afterwards every contest answer and the problem pages' contest context are stale. */
export function useParticipation(key: Ref<string>) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    /** The request holds the access code: drop it from the cache as soon as no observer needs it. */
    gcTime: 0,
    mutationFn: (request: Request) => send(key.value, request),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['contests'] }),
        queryClient.invalidateQueries({ queryKey: ['problems'] }),
      ]),
  });
  return {
    run: async (
      command: ParticipationCommand,
      entry: { accessCode?: string; acceptance?: RulesAcceptance } = {},
    ) => {
      await mutation.mutateAsync({ command, ...entry });
    },
    isPending: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
}
