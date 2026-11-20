import { computed, ref, watch } from 'vue';
import { ApiError } from '@/api/client';
import type { ContestPatch, EditableContest } from '@/api/types/contest-editing';
import { failureReasonOf } from '../../problems/failure-reason';
import { isAllSaved, runOrderedParts } from '../../ui/workbench/save-parts';
import type { SavePart, SavePartAnswer, SavePartOutcome } from '../../ui/workbench/save-parts';
import { rescoresOn } from '../contest-admin';
import { useContestForm } from '../general/use-contest-form';
import { useContestProblemRows } from '../problems/use-contest-problem-rows';
import type { ContestSectionId } from './contest-workbench-tabs';
import {
  accessChangesOf,
  accessSaveOf,
  chooseParticipantMode,
  participantGapsOf,
  restoreAccess,
  shownModeOf,
  shownRestrictions,
} from './participants-mode';
import type { AccessSave, ParticipantMode } from './participants-mode';

/**
 * The contest workbench's one save, as two parts. Both are a PATCH of the same contest and neither needs the other's
 * answer, so a failed part never stops the next one. Settings go first: they hold the label style the problem list is
 * shown with.
 */
export const CONTEST_SAVE_ORDER = ['settings', 'problems'] as const;
export type ContestSavePartId = (typeof CONTEST_SAVE_ORDER)[number];

/** The fields that say who may take part: a refusal of a save that changed one is shown in the participants section. */
const ACCESS_FIELDS: readonly string[] = [
  'isPrivate',
  'privateContestants',
  'isOrganizationPrivate',
  'organizations',
  'accessCode',
];
/** The fields each setup section edits; a field not named here belongs to the last section ("info"). */
const SECTION_FIELDS: Record<
  Exclude<ContestSectionId, 'problems' | 'announcements' | 'info'>,
  readonly string[]
> = {
  time: [
    'startTime',
    'endTime',
    'formatName',
    'formatConfig',
    'frozenLastMinutes',
    'scoreboardVisibility',
    'isRated',
    'registrationStart',
    'registrationEnd',
    'lockedAfter',
    'timeLimit',
    'disallowVirtual',
    'labelStyle',
    'pointsPrecision',
    'runPretestsOnly',
    'hideProblemTags',
    'hideProblemAuthors',
    'showShortDisplay',
    'showSubmissionList',
    'pushAnnouncements',
    'rateAll',
    'rateExclude',
    'ratingFloor',
    'ratingCeiling',
    'scoreboardCacheTimeout',
    'viewContestScoreboard',
    'rankingAccessCode',
  ],
  participants: [...ACCESS_FIELDS, 'bannedUsers', 'bannedJudges'],
};

/**
 * The reason a settings save was refused, when it belongs beside "who may take part": the save changed one of
 * `ACCESS_FIELDS` and the server named one of them or no field at all (a missing permission names none).
 */
export function accessRefusalOf(patch: ContestPatch, answered: unknown): string | null {
  if (!(answered instanceof ApiError)) return null;
  if (!Object.keys(patch).some((field) => ACCESS_FIELDS.includes(field))) return null;
  const named = [...answered.issues.map((issue) => issue.field), ...Object.keys(answered.fields)]
    .filter((field) => field !== '')
    .map((field) => field.split('.')[0]!);
  const isElsewhere = named.length > 0 && !named.some((field) => ACCESS_FIELDS.includes(field));
  return isElsewhere ? null : failureReasonOf(answered);
}

/** The setup section a settings field is edited in (`formatConfig.penalty` counts as `formatConfig`). */
export function sectionOfField(field: string): 'time' | 'participants' | 'info' {
  const name = field.split('.')[0]!;
  if (SECTION_FIELDS.time.includes(name)) return 'time';
  return SECTION_FIELDS.participants.includes(name) ? 'participants' : 'info';
}

/** A part's answer from what its `saveTo` gave back: a refusal (or nothing sent) means it was not saved. */
const answerOf = (answered: EditableContest | ApiError | null): SavePartAnswer =>
  answered === null || answered instanceof ApiError ? { failure: failureReasonOf(answered) } : {};

/**
 * The workbench's forms and their one save. The settings and the problem list each keep their own draft; `save()`
 * checks both, sends the changed ones in `CONTEST_SAVE_ORDER`, reports each part and keeps a failed part's edits.
 */
export function useContestWorkbench(contest: () => EditableContest) {
  const settings = useContestForm(contest);
  const problems = useContestProblemRows(contest);

  const changes = computed(() => {
    const counts = { time: 0, participants: 0, info: 0, problems: problems.dirtyCount.value };
    for (const field of Object.keys(settings.pendingPatch.value))
      counts[sectionOfField(field)] += 1;
    return counts;
  });
  const dirtyCount = computed(() => settings.dirtyCount.value + problems.dirtyCount.value);

  const isSaving = ref(false);
  const savedAt = ref<Date | null>(null);
  /** The last save's parts, kept on screen while one of them is not saved. */
  const report = ref<SavePartOutcome<ContestSavePartId>[] | null>(null);
  /** The sections whose check failed on the last save attempt: the page opens them. */
  const invalidSections = ref<ContestSectionId[]>([]);

  const participants = useParticipantsChoice(contest, settings);
  /** The save that waits for the teacher's confirm because it removes a restriction; null when none waits. */
  const widening = ref<Extract<AccessSave, { kind: 'confirm' }> | null>(null);

  function checkAll(): ContestSectionId[] {
    const invalid = new Set<ContestSectionId>();
    if (settings.dirtyCount.value > 0 && !settings.validate()) {
      Object.keys(settings.errors.value).forEach((field) => invalid.add(sectionOfField(field)));
      // A date box holding text that is not a date changes no model: both sections with a date box are shown.
      if (settings.hasUnreadableDate.value) invalid.add('time');
    }
    if (participants.save.value.kind === 'blocked') invalid.add('participants');
    if (problems.dirtyCount.value > 0 && !problems.validate()) invalid.add('problems');
    return [...invalid];
  }

  /** Sends the settings and keeps a refusal that is about who may take part, for its section. */
  async function saveSettings(): Promise<SavePartAnswer> {
    const patch = settings.pendingPatch.value;
    const answered = await settings.saveTo();
    participants.refusal.value = accessRefusalOf(patch, answered);
    return answerOf(answered);
  }

  function changedParts(): SavePart<ContestSavePartId>[] {
    const parts: SavePart<ContestSavePartId>[] = [];
    if (settings.dirtyCount.value > 0) parts.push({ id: 'settings', run: saveSettings });
    if (problems.dirtyCount.value > 0)
      parts.push({ id: 'problems', run: async () => answerOf(await problems.saveTo()) });
    return parts;
  }

  async function send() {
    isSaving.value = true;
    try {
      const run = await runOrderedParts(contest().key, changedParts(), CONTEST_SAVE_ORDER);
      report.value = isAllSaved(run.outcomes) ? null : run.outcomes;
      if (isAllSaved(run.outcomes)) savedAt.value = new Date();
    } finally {
      isSaving.value = false;
    }
  }

  /** Checks the page, then sends it; a save that removes a restriction on who may take part waits for `confirmWidening`. */
  async function save() {
    if (isSaving.value) return;
    invalidSections.value = checkAll();
    if (invalidSections.value.length > 0 || dirtyCount.value === 0) return;
    const decision = participants.save.value;
    if (decision.kind === 'confirm') widening.value = decision;
    else if (decision.kind === 'send') await send();
  }

  /** The teacher confirmed the removal in the dialog: the checked save goes. */
  async function confirmWidening() {
    if (isSaving.value || widening.value === null) return;
    widening.value = null;
    await send();
  }

  function discard() {
    settings.discard();
    problems.discard();
    participants.reset();
    widening.value = null;
    report.value = null;
    invalidSections.value = [];
  }

  return {
    settings,
    problems,
    changes,
    dirtyCount,
    /** The save will queue a rescore of every participation (a scoring field or the problem list changed). */
    willRescore: computed(
      () => rescoresOn(settings.pendingPatch.value) || problems.dirtyCount.value > 0,
    ),
    participants,
    widening,
    confirmWidening,
    isSaving,
    savedAt,
    report,
    invalidSections,
    save,
    discard,
  };
}
/**
 * "Who may take part" over the settings form: the teacher's pick, what the section shows and what a save would do
 * (`participants-mode.ts`). The pick is forgotten when the form is filled again (after a save, or a discard).
 */
function useParticipantsChoice(
  contest: () => EditableContest,
  settings: ReturnType<typeof useContestForm>,
) {
  const choice = ref<ParticipantMode | null>(null);
  /** The last save's refusal, when it was about who may take part. */
  const refusal = ref<string | null>(null);
  const hasStoredCode = () => contest().requiresAccessCode;
  const { form, seed } = settings;

  function reset() {
    choice.value = null;
    refusal.value = null;
  }
  watch(seed, reset);

  return {
    choice,
    refusal,
    reset,
    mode: computed(() => shownModeOf(form.value, choice.value, hasStoredCode())),
    restrictions: computed(() => shownRestrictions(form.value, choice.value, hasStoredCode())),
    gaps: computed(() => participantGapsOf(form.value, choice.value, hasStoredCode())),
    changes: computed(() => accessChangesOf(seed.value, form.value, hasStoredCode())),
    save: computed(() => accessSaveOf(seed.value, form.value, choice.value, hasStoredCode())),
    /** Switches the picked mode's restriction on and the others off in the form; the lists stay. */
    pick: (mode: ParticipantMode) => {
      chooseParticipantMode(form.value, mode, hasStoredCode());
      choice.value = mode;
    },
    /** Back to the stored contest's restrictions. */
    undo: () => {
      restoreAccess(form.value, seed.value);
      reset();
    },
  };
}

export type ContestWorkbenchState = ReturnType<typeof useContestWorkbench>;
