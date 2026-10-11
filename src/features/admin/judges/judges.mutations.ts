import { deleteJudge, disconnectJudge, rotateJudgeKey, updateJudge } from '@/api/judges-admin.api';
import type { Judge, JudgePatch } from '@/api/types/judges-admin';
import { useAdminMutation } from '../ui/use-admin-mutation';
import { useJudgesCache } from './judges.queries';

/** The writes one judge row makes. Each has its own in-flight guard, so one row's double click cannot repeat a write. */
export function useJudgeWrites() {
  const cache = useJudgesCache();
  const patch = useAdminMutation<{ name: string; patch: JudgePatch }, Judge>({
    mutate: ({ name, patch: changes }) => updateJudge(name, changes),
    onDone: (judge) => cache.replace(judge),
  });
  const rotate = useAdminMutation<string, { authKey: string }>({
    mutate: (name) => rotateJudgeKey(name),
  });
  const disconnect = useAdminMutation<{ name: string; force: boolean }, void>({
    mutate: ({ name, force }) => disconnectJudge(name, force),
  });
  /** The row drops itself from the cache once its dialog has closed. */
  const remove = useAdminMutation<string, void>({
    mutate: (name) => deleteJudge(name),
  });
  return { patch, rotate, disconnect, remove };
}
