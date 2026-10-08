import { useMutation, useQueryClient } from '@tanstack/vue-query';
import type { Ref } from 'vue';
import { joinContest, leaveContest, registerContest } from '@/api/contests.api';
import type { ParticipationCommand } from './contest-action';

interface Request {
  command: ParticipationCommand;
  accessCode?: string;
}
const send = (key: string, { command, accessCode }: Request): Promise<unknown> => {
  if (command === 'leave') return leaveContest(key);
  return command === 'register' ? registerContest(key, accessCode) : joinContest(key, accessCode);
};

/** Join, register or leave; afterwards every contest answer and the problem pages' contest context are stale. */
export function useParticipation(key: Ref<string>) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (request: Request) => send(key.value, request),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['contests'] }),
        queryClient.invalidateQueries({ queryKey: ['problems'] }),
      ]),
  });
  return {
    run: async (command: ParticipationCommand, accessCode?: string) => {
      await mutation.mutateAsync({ command, accessCode });
    },
    isPending: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
}
