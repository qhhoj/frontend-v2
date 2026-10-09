import { computed, ref } from 'vue';
import { putTranslation, updateProblem } from '@/api/problem-editing.api';
import type { EditableProblem } from '@/api/types/problem-editing';
import { usePermissions } from '@/stores/use-permissions';
import { useAdminMutation } from '../../ui/use-admin-mutation';
import {
  isOriginalLocked,
  previewStyleFor,
  STATEMENT_SLOTS,
  statementDraftOf,
} from './statement-drafts';
import type { StatementDraft, StatementSlot } from './statement-drafts';

export const FULL_MARKUP_PERMISSION = 'judge.problem_full_markup';

const seedDrafts = (problem: EditableProblem) =>
  Object.fromEntries(
    STATEMENT_SLOTS.map((slot) => [slot, statementDraftOf(problem, slot)]),
  ) as Record<StatementSlot, StatementDraft>;

/** A translation is saved with PUT; the original description with PATCH on the problem. */
function saveSlot(code: string, target: StatementSlot, draft: StatementDraft): Promise<unknown> {
  if (target === 'original') return updateProblem(code, { description: draft.description });
  return putTranslation(code, target, { name: draft.name, description: draft.description });
}

/** The statements tab: one draft per slot for the page's life, saved one slot at a time. */
export function useStatementDrafts(problem: () => EditableProblem) {
  const { can } = usePermissions();
  const slot = ref<StatementSlot>('vi');
  const drafts = ref(seedDrafts(problem()));
  const current = computed(() => drafts.value[slot.value]);
  const canFullMarkup = computed(() => can(FULL_MARKUP_PERMISSION));
  const isLocked = computed(
    () => slot.value === 'original' && isOriginalLocked(problem(), canFullMarkup.value),
  );
  const previewStyle = computed(() => previewStyleFor(problem(), canFullMarkup.value));

  const saveMutation = useAdminMutation({
    mutate: (target: StatementSlot) => saveSlot(problem().code, target, drafts.value[target]),
    invalidates: () => [['admin', 'problem', problem().code]],
    onDone: (_saved: unknown, target: StatementSlot) => {
      drafts.value[target].exists = true;
    },
  });

  async function save() {
    if (!isLocked.value) await saveMutation.run(slot.value);
  }

  function discard() {
    drafts.value[slot.value] = statementDraftOf(problem(), slot.value);
  }

  return {
    slot,
    drafts,
    current,
    isLocked,
    previewStyle,
    canFullMarkup,
    save,
    discard,
    saveMutation,
  };
}
