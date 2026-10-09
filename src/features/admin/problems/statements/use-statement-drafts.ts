import { computed, ref } from 'vue';
import type { Ref } from 'vue';
import { putTranslation, updateProblem } from '@/api/problem-editing.api';
import type { EditableProblem } from '@/api/types/problem-editing';
import { usePermissions } from '@/stores/use-permissions';
import { useAdminMutation } from '../../ui/use-admin-mutation';
import {
  checkStatementDraft,
  isOriginalLocked,
  previewStyleFor,
  STATEMENT_SLOTS,
  statementDraftOf,
} from './statement-drafts';
import type { StatementDraft, StatementSlot } from './statement-drafts';

export const FULL_MARKUP_PERMISSION = 'judge.problem_full_markup';

type Drafts = Record<StatementSlot, StatementDraft>;

const seedDrafts = (problem: EditableProblem): Drafts =>
  Object.fromEntries(
    STATEMENT_SLOTS.map((slot) => [slot, statementDraftOf(problem, slot)]),
  ) as Drafts;

/** The text a slot is saved with: a translation goes to PUT, the original description to PATCH on the problem. */
function saveSlot(code: string, target: StatementSlot, draft: StatementDraft): Promise<unknown> {
  if (target === 'original') return updateProblem(code, { description: draft.description });
  return putTranslation(code, target, { name: draft.name, description: draft.description });
}

const sameText = (left: StatementDraft, right: StatementDraft) =>
  left.name === right.name && left.description === right.description;

/** Whether any slot's text differs from what was last saved (the exists flag does not count). */
const hasUnsaved = (drafts: Drafts, saved: Drafts) =>
  STATEMENT_SLOTS.some((item) => !sameText(drafts[item], saved[item]));

/**
 * Whether saving the slot would write its description: the original always does (it is the description), a translation does
 * when the text changed or the translation is new. A full-markup problem's description needs the full-markup permission.
 */
const isDescriptionWrite = (target: StatementSlot, drafts: Drafts, saved: Drafts) =>
  target === 'original' ||
  !saved[target].exists ||
  drafts[target].description !== saved[target].description;

/** After a save the slot's saved text is what was just written, and it is no longer missing. */
function recordSaved(drafts: Ref<Drafts>, saved: Ref<Drafts>, target: StatementSlot) {
  drafts.value[target].exists = true;
  saved.value[target] = { ...drafts.value[target] };
}

/** The statements tab: one draft per slot for the page's life, saved one slot at a time, with the last saved text as the baseline. */
export function useStatementDrafts(problem: () => EditableProblem) {
  const { can } = usePermissions();
  const slot = ref<StatementSlot>('vi');
  const drafts = ref<Drafts>(seedDrafts(problem()));
  const saved = ref<Drafts>(seedDrafts(problem()));
  const current = computed(() => drafts.value[slot.value]);
  const canFullMarkup = computed(() => can(FULL_MARKUP_PERMISSION));
  const isLocked = computed(
    () =>
      isOriginalLocked(problem(), canFullMarkup.value) &&
      isDescriptionWrite(slot.value, drafts.value, saved.value),
  );
  const previewStyle = computed(() => previewStyleFor(problem(), canFullMarkup.value));
  const errors = computed(() => checkStatementDraft(current.value, slot.value));
  const isDirty = computed(() => hasUnsaved(drafts.value, saved.value));

  const saveMutation = useAdminMutation({
    mutate: (target: StatementSlot) => saveSlot(problem().code, target, drafts.value[target]),
    invalidates: () => [['admin', 'problem', problem().code]],
    onDone: (_saved: unknown, target: StatementSlot) => recordSaved(drafts, saved, target),
  });

  async function save() {
    if (isLocked.value || Object.keys(errors.value).length > 0) return;
    await saveMutation.run(slot.value);
  }

  function discard() {
    drafts.value[slot.value] = statementDraftOf(problem(), slot.value);
  }

  return {
    slot,
    drafts,
    current,
    isLocked,
    isDirty,
    previewStyle,
    canFullMarkup,
    errors,
    save,
    discard,
    saveMutation,
  };
}
