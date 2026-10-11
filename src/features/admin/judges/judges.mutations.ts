import { deleteJudge, disconnectJudge, rotateJudgeKey, updateJudge } from '@/api/judges-admin.api';
import type { Judge, JudgePatch } from '@/api/types/judges-admin';
import { translate } from '@/i18n';
import { useAdminMutation } from '../ui/use-admin-mutation';
import { useJudgesCache } from './judges.queries';

/** The toast after a patch names what changed: one flag or the description per write. */
function patchedText({ name, patch }: { name: string; patch: JudgePatch }) {
  if (patch.isDisabled !== undefined)
    return translate(`admin.judges.toast.${patch.isDisabled ? 'disabled' : 'enabled'}`, { name });
  if (patch.isBlocked !== undefined)
    return translate(`admin.judges.toast.${patch.isBlocked ? 'blocked' : 'unblocked'}`, { name });
  return translate('admin.judges.toast.description', { name });
}

/** The writes the judges board makes. Each has its own in-flight guard, so a double click cannot repeat a write. */
export function useJudgeWrites() {
  const cache = useJudgesCache();
  const patch = useAdminMutation<{ name: string; patch: JudgePatch }, Judge>({
    mutate: ({ name, patch: changes }) => updateJudge(name, changes),
    onDone: (judge) => cache.replace(judge),
    successText: (_judge, vars) => patchedText(vars),
  });
  /** No toast: the new key opens in its own dialog. */
  const rotate = useAdminMutation<string, { authKey: string }>({
    mutate: (name) => rotateJudgeKey(name),
  });
  const disconnect = useAdminMutation<{ name: string; force: boolean }, void>({
    mutate: ({ name, force }) => disconnectJudge(name, force),
    successText: (_result, { name }) => translate('admin.judges.toast.disconnected', { name }),
  });
  /** The page drops the judge from the cache once its dialog has closed. */
  const remove = useAdminMutation<string, void>({
    mutate: (name) => deleteJudge(name),
    successText: (_result, name) => translate('admin.judges.toast.deleted', { name }),
  });
  return { patch, rotate, disconnect, remove };
}
