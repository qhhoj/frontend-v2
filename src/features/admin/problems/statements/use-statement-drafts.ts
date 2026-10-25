import { computed, ref } from 'vue';
import type { Ref } from 'vue';
import { putTranslation, updateProblem } from '@/api/problem-editing.api';
import type { EditableProblem } from '@/api/types/problem-editing';
import { translate } from '@/i18n';
import { usePermissions } from '@/stores/use-permissions';
import { useSeededDraft } from '../../ui/form/seeded-draft';
import { useAdminMutation } from '../../ui/use-admin-mutation';
import { PUBLIC_PROBLEMS_KEY } from '../problem-editing.queries';
import {
  checkStatementDraft,
  initialSlotOf,
  isOriginalLocked,
  previewStyleFor,
  sentDescription,
  STATEMENT_SLOTS,
  statementDraftOf,
  visibleStatementErrors,
} from './statement-drafts';
import type { StatementDraft, StatementSlot } from './statement-drafts';

export const FULL_MARKUP_PERMISSION = 'judge.problem_full_markup';

type Drafts = Record<StatementSlot, StatementDraft>;
/** One slot's save, to the problem the drafts were filled from. */
interface SlotSave {
  code: string;
  target: StatementSlot;
}

const seedDrafts = (problem: EditableProblem): Drafts =>
  Object.fromEntries(
    STATEMENT_SLOTS.map((slot) => [slot, statementDraftOf(problem, slot)]),
  ) as Drafts;

/** The text a slot is saved with: a translation goes to PUT, the original description to PATCH on the problem. */
function saveSlot(code: string, target: StatementSlot, draft: StatementDraft): Promise<unknown> {
  const description = sentDescription(draft);
  if (target === 'original') return updateProblem(code, { description });
  return putTranslation(code, target, { name: draft.name, description });
}

/** How many of a slot's two texts (name, description) differ from what was last saved. */
const changedFields = (draft: StatementDraft, saved: StatementDraft) =>
  Number(draft.name !== saved.name) + Number(draft.description !== saved.description);

/**
 * The one count of unsaved changes, per slot. The save bar counts the slot on screen (one slot saves at a time) and names the
 * other slots' changes (`otherUnsaved`); the leave guard counts them all, so it never reports a change the bar hid.
 */
function useSlotChanges(drafts: Ref<Drafts>, saved: Ref<Drafts>, slot: Ref<StatementSlot>) {
  const changesBySlot = computed(
    () =>
      Object.fromEntries(
        STATEMENT_SLOTS.map((item) => [item, changedFields(drafts.value[item], saved.value[item])]),
      ) as Record<StatementSlot, number>,
  );
  const dirtyCount = computed(() => changesBySlot.value[slot.value]);
  const totalDirtyCount = computed(() =>
    STATEMENT_SLOTS.reduce((total, item) => total + changesBySlot.value[item], 0),
  );
  const otherUnsaved = computed(() =>
    STATEMENT_SLOTS.filter((item) => item !== slot.value && changesBySlot.value[item] > 0).map(
      (item) => ({ slot: item, count: changesBySlot.value[item] }),
    ),
  );
  return { changesBySlot, dirtyCount, totalDirtyCount, otherUnsaved };
}

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
  drafts.value[target].storedDescription = sentDescription(drafts.value[target]);
  saved.value[target] = { ...drafts.value[target] };
}

/** The statements tab: one draft per slot for the page's life, saved one slot at a time, with the last saved text as the baseline. */
export function useStatementDrafts(problem: () => EditableProblem) {
  const { can } = usePermissions();
  const slot = ref<StatementSlot>(initialSlotOf(problem()));
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
  /** Slots whose save was tried since their last save or discard: their errors all show. */
  const triedSlots = ref(new Set<StatementSlot>());
  const visibleErrors = computed(() =>
    visibleStatementErrors(
      errors.value,
      current.value,
      saved.value[slot.value],
      triedSlots.value.has(slot.value),
    ),
  );
  const { changesBySlot, dirtyCount, totalDirtyCount, otherUnsaved } = useSlotChanges(
    drafts,
    saved,
    slot,
  );
  const savedAt = ref<Date | null>(null);
  /** Every slot follows the problem on screen; a newer copy of it only while no slot is edited. */
  const { target: seededCode } = useSeededDraft(problem, {
    idOf: (stored) => stored.code,
    routeParam: 'code',
    isDirty: () => totalDirtyCount.value > 0,
    refill: (stored) => {
      drafts.value = seedDrafts(stored);
      saved.value = seedDrafts(stored);
    },
  });

  const saveMutation = useAdminMutation({
    mutate: ({ code, target }: SlotSave) => saveSlot(code, target, drafts.value[target]),
    invalidates: ({ code }: SlotSave) => [['admin', 'problem', code], PUBLIC_PROBLEMS_KEY],
    successText: (_saved: unknown, { target }: SlotSave) =>
      translate('admin.problems.statements.savedToast', {
        slot: translate(`admin.problems.statements.slots.${target}`),
      }),
    onSuccess: () => (savedAt.value = new Date()),
    onDone: (_saved: unknown, { target }: SlotSave) => {
      recordSaved(drafts, saved, target);
      triedSlots.value.delete(target);
    },
  });

  async function save() {
    triedSlots.value.add(slot.value);
    if (isLocked.value || Object.keys(errors.value).length > 0) return;
    // The slot goes to the problem it was filled from, and nowhere while the page shows another one.
    const code = seededCode();
    if (dirtyCount.value === 0 || !code) return;
    await saveMutation.run({ code, target: slot.value });
  }

  /** Puts the slot on screen back to its last saved text. */
  function discard() {
    drafts.value[slot.value] = { ...saved.value[slot.value] };
    triedSlots.value.delete(slot.value);
  }

  return {
    slot,
    drafts,
    current,
    isLocked,
    changesBySlot,
    dirtyCount,
    totalDirtyCount,
    otherUnsaved,
    savedAt,
    previewStyle,
    canFullMarkup,
    errors: visibleErrors,
    save,
    discard,
    saveMutation,
  };
}
