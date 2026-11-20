import { computed, ref } from 'vue';
import type { Ref } from 'vue';
import { putTranslation, updateProblem } from '@/api/problem-editing.api';
import type { EditableProblem } from '@/api/types/problem-editing';
import { translate } from '@/i18n';
import type { ApiError } from '@/api/client';
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
/** A slot saved on its own by PUT: every slot but the original, whose description goes with the problem PATCH. */
type TranslationSlot = Exclude<StatementSlot, 'original'>;
/** One slot's change, to the problem the drafts were filled from. */
interface SlotSave {
  code: string;
  target: StatementSlot;
}
interface TranslationSave extends SlotSave {
  target: TranslationSlot;
}

const seedDrafts = (problem: EditableProblem): Drafts =>
  Object.fromEntries(
    STATEMENT_SLOTS.map((slot) => [slot, statementDraftOf(problem, slot)]),
  ) as Drafts;

/** A translation's save. The original description is not saved here: it goes in the page's one problem PATCH. */
const saveTranslationSlot = (code: string, target: TranslationSlot, draft: StatementDraft) =>
  putTranslation(code, target, { name: draft.name, description: sentDescription(draft) });

/** Sets the slot's trust for the text last saved (the text the holder was shown), never for unsaved edits. */
function saveSlotTrust(
  code: string,
  target: StatementSlot,
  { saved, isTrusted }: { saved: StatementDraft; isTrusted: boolean },
): Promise<unknown> {
  const description = saved.storedDescription;
  if (target === 'original')
    return updateProblem(code, { description, isDescriptionMarkupTrusted: isTrusted });
  return putTranslation(code, target, {
    name: saved.name,
    description,
    isMarkupTrusted: isTrusted,
  });
}

/** How many of a slot's two texts (name, description) differ from what was last saved. */
const changedFields = (draft: StatementDraft, saved: StatementDraft) =>
  Number(draft.name !== saved.name) + Number(draft.description !== saved.description);

/** The one count of unsaved changes, per slot and in total; the page's save bar and leave guard read the total. */
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
  const dirtySlots = computed(() =>
    STATEMENT_SLOTS.filter((item) => changesBySlot.value[item] > 0),
  );
  return { changesBySlot, dirtyCount, totalDirtyCount, dirtySlots };
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

/**
 * The statement section: one draft per slot for the page's life, with the last saved text as the baseline. The page's one save
 * checks every edited slot (`validate`), sends the original description with the problem PATCH (`originalPatch`, then
 * `markOriginalSaved`) and each edited translation on its own (`saveTranslation`).
 */
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
  const previewStyle = computed(() =>
    previewStyleFor(problem(), current.value, canFullMarkup.value),
  );
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
  const { changesBySlot, dirtyCount, totalDirtyCount, dirtySlots } = useSlotChanges(
    drafts,
    saved,
    slot,
  );
  /** Every slot follows the problem on screen; a newer copy of it only while no slot is edited. */
  const { target: seededCode, retarget } = useSeededDraft(problem, {
    idOf: (stored) => stored.code,
    routeParam: 'code',
    isDirty: () => totalDirtyCount.value > 0,
    refill: (stored) => {
      drafts.value = seedDrafts(stored);
      saved.value = seedDrafts(stored);
    },
  });

  const saveMutation = useAdminMutation({
    mutate: ({ code, target }: TranslationSave) =>
      saveTranslationSlot(code, target, drafts.value[target]),
    invalidates: ({ code }: SlotSave) => [['admin', 'problem', code], PUBLIC_PROBLEMS_KEY],
    onSuccess: (_saved: unknown, { target }: TranslationSave) => {
      recordSaved(drafts, saved, target);
      triedSlots.value.delete(target);
    },
  });

  /** Whether an edited slot cannot be sent: a text the backend would refuse, or a description this viewer may not write. */
  const isSlotInvalid = (item: StatementSlot) =>
    Object.keys(checkStatementDraft(drafts.value[item], item)).length > 0 ||
    (isOriginalLocked(problem(), canFullMarkup.value) &&
      isDescriptionWrite(item, drafts.value, saved.value));

  /** Checks every edited slot; the first one that cannot be sent comes on screen with its errors. True when all may be sent. */
  function validate(): boolean {
    dirtySlots.value.forEach((item) => triedSlots.value.add(item));
    const invalid = dirtySlots.value.filter(isSlotInvalid);
    if (invalid.length > 0 && !invalid.includes(slot.value)) slot.value = invalid[0]!;
    return invalid.length === 0;
  }

  /** The original description as the problem PATCH sends it, or null while it is unchanged. */
  const originalPatch = () =>
    changesBySlot.value.original > 0
      ? { description: sentDescription(drafts.value.original) }
      : null;
  function markOriginalSaved() {
    recordSaved(drafts, saved, 'original');
    triedSlots.value.delete('original');
  }

  /** Sends one translation to the problem `code`: null when saved, else the refusal. */
  async function saveTranslation(code: string, target: TranslationSlot): Promise<ApiError | null> {
    await saveMutation.run({ code, target });
    return saveMutation.failure.value;
  }

  const trustMutation = useAdminMutation({
    mutate: ({ code, target, isTrusted }: SlotSave & { isTrusted: boolean }) =>
      saveSlotTrust(code, target, { saved: saved.value[target], isTrusted }),
    invalidates: ({ code }: SlotSave) => [['admin', 'problem', code], PUBLIC_PROBLEMS_KEY],
    successText: (_saved: unknown, { isTrusted }: { isTrusted: boolean }) =>
      translate(
        isTrusted
          ? 'admin.problems.statements.trust.trustedToast'
          : 'admin.problems.statements.trust.untrustedToast',
      ),
    onSuccess: (_saved: unknown, { target, isTrusted }: SlotSave & { isTrusted: boolean }) => {
      drafts.value[target].isMarkupTrusted = isTrusted;
      saved.value[target].isMarkupTrusted = isTrusted;
    },
  });
  /** A holder may set the trust of a saved slot with no unsaved change: the trust then covers exactly the text shown. */
  const canSetTrust = computed(
    () => canFullMarkup.value && current.value.exists && dirtyCount.value === 0,
  );

  /** Sets the trust of the slot on screen, for its last saved text. */
  async function setTrust(isTrusted: boolean) {
    const code = seededCode();
    if (!canSetTrust.value || !code) return;
    await trustMutation.run({ code, target: slot.value, isTrusted });
  }

  /** Puts every slot back to its last saved text. */
  function discard() {
    STATEMENT_SLOTS.forEach((item) => (drafts.value[item] = { ...saved.value[item] }));
    triedSlots.value.clear();
  }

  return {
    slot,
    drafts,
    current,
    isLocked,
    changesBySlot,
    dirtyCount,
    totalDirtyCount,
    dirtySlots,
    previewStyle,
    canFullMarkup,
    errors: visibleErrors,
    validate,
    originalPatch,
    markOriginalSaved,
    saveTranslation,
    retarget,
    discard,
    canSetTrust,
    setTrust,
    trustMutation,
  };
}
