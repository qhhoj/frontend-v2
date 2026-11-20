import { computed, ref } from 'vue';
import { ApiError } from '@/api/client';
import type { EditableContest } from '@/api/types/contest-editing';
import { failureReasonOf } from '../../problems/failure-reason';
import { isAllSaved, runOrderedParts } from '../../ui/workbench/save-parts';
import type { SavePart, SavePartAnswer, SavePartOutcome } from '../../ui/workbench/save-parts';
import { rescoresOn } from '../contest-admin';
import { useContestForm } from '../general/use-contest-form';
import { useContestProblemRows } from '../problems/use-contest-problem-rows';
import type { ContestSectionId } from './contest-workbench-tabs';
import { chooseParticipantMode, keepsAccessCode, participantModeOf } from './participants-mode';
import type { ParticipantMode } from './participants-mode';

/**
 * The contest workbench's one save, as two parts. Both are a PATCH of the same contest and neither needs the other's
 * answer, so a failed part never stops the next one. Settings go first: they hold the label style the problem list is
 * shown with.
 */
export const CONTEST_SAVE_ORDER = ['settings', 'problems'] as const;
export type ContestSavePartId = (typeof CONTEST_SAVE_ORDER)[number];

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
  participants: [
    'isPrivate',
    'privateContestants',
    'isOrganizationPrivate',
    'organizations',
    'accessCode',
    'bannedUsers',
    'bannedJudges',
  ],
};
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

  /** Set when the teacher picks "Ai có mã vào" before a code exists: the fields alone cannot say so yet. */
  const wantsCode = ref(false);
  const hasStoredCode = () => contest().requiresAccessCode;
  const participantMode = computed<ParticipantMode>(() => {
    const mode = participantModeOf(settings.form.value, hasStoredCode());
    return mode === 'open' && wantsCode.value ? 'code' : mode;
  });
  /** Sets the picked mode's fields and clears the other two groups (`chooseParticipantMode`). */
  function pickParticipantMode(mode: ParticipantMode) {
    chooseParticipantMode(settings.form.value, mode, hasStoredCode());
    wantsCode.value = mode === 'code';
  }
  /** "Ai có mã vào" with no code stored and none typed is not a rule yet: the save waits for the code. */
  const isCodeMissing = computed(
    () =>
      participantMode.value === 'code' && !keepsAccessCode(settings.form.value, hasStoredCode()),
  );

  function checkAll(): ContestSectionId[] {
    const invalid = new Set<ContestSectionId>();
    if (settings.dirtyCount.value > 0 && !settings.validate()) {
      Object.keys(settings.errors.value).forEach((field) => invalid.add(sectionOfField(field)));
      // A date box holding text that is not a date changes no model: both sections with a date box are shown.
      if (settings.hasUnreadableDate.value) invalid.add('time');
    }
    if (isCodeMissing.value) invalid.add('participants');
    if (problems.dirtyCount.value > 0 && !problems.validate()) invalid.add('problems');
    return [...invalid];
  }

  function changedParts(): SavePart<ContestSavePartId>[] {
    const parts: SavePart<ContestSavePartId>[] = [];
    if (settings.dirtyCount.value > 0)
      parts.push({ id: 'settings', run: async () => answerOf(await settings.saveTo()) });
    if (problems.dirtyCount.value > 0)
      parts.push({ id: 'problems', run: async () => answerOf(await problems.saveTo()) });
    return parts;
  }

  async function save() {
    if (isSaving.value) return;
    invalidSections.value = checkAll();
    if (invalidSections.value.length > 0 || dirtyCount.value === 0) return;
    isSaving.value = true;
    try {
      const run = await runOrderedParts(contest().key, changedParts(), CONTEST_SAVE_ORDER);
      report.value = isAllSaved(run.outcomes) ? null : run.outcomes;
      if (isAllSaved(run.outcomes)) savedAt.value = new Date();
    } finally {
      isSaving.value = false;
    }
  }

  function discard() {
    settings.discard();
    problems.discard();
    wantsCode.value = false;
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
    participantMode,
    pickParticipantMode,
    isCodeMissing,
    isSaving,
    savedAt,
    report,
    invalidSections,
    save,
    discard,
  };
}
export type ContestWorkbenchState = ReturnType<typeof useContestWorkbench>;
