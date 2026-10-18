import { computed, ref, watch } from 'vue';
import type { Ref } from 'vue';
import type { ContestDetail } from '@/api/types/contests';
import type { ProblemDetail } from '@/api/types/problems';
import { MAX_SOURCE_LENGTH, codePointCount } from '@/lib/source';
import { useSubmitMessage } from './submit-message';
import { useResubmitPrefill } from './use-resubmit-prefill';
import type { ResubmitPrefill } from './use-resubmit-prefill';
import { useContestProblem } from './use-contest-problem';
import { useSourceTemplate } from './use-source-template';
import { useSubmitFile } from './use-submit-file';
import { useSubmitLanguage } from './use-submit-language';
import { useSubmitRequest } from './use-submit-request';
import { useSubmitResult } from './use-submit-result';

/**
 * State of the submit form, shared by the desktop dock and the phone sheet. Each concern lives in its own
 * composable (language, template, file, request, resubmit); this one only wires them together and gates submit.
 * `contest` is the viewer's contest holding the problem: the result strip then scores on the contest's points.
 */
export function useSubmitForm(
  problem: Ref<ProblemDetail>,
  resubmitId: Ref<string | null>,
  contest: () => ContestDetail | null | undefined = () => null,
) {
  const source = ref('');
  const { errorText, report } = useSubmitMessage();
  const switchLanguage = () => {
    clearFile(); // a file belongs to the language it was checked against (extension, size cap)
    report(null);
  };
  const languageState = useSubmitLanguage(problem, switchLanguage);
  const { languageId, language, fileMode, uploadsOff, isPicked, setLanguage } = languageState;
  const { templateRestored, hasViewerCode } = useSourceTemplate(language, source, isPicked);
  const { chosenFile, chooseFile, clearFile, loadFile } = useSubmitFile(language, source, report);

  const length = computed(() => codePointCount(source.value));
  const tooLong = computed(() => length.value > MAX_SOURCE_LENGTH);
  /** B19: `null` means the contest sets no cap. */
  const attemptsLeft = computed(() => problem.value.contest?.attemptsLeft ?? null);
  const hasInput = computed(() =>
    fileMode.value ? chosenFile.value !== null : length.value > 0 && !tooLong.value,
  );
  const isReady = computed(
    () =>
      languageId.value !== null && !uploadsOff.value && attemptsLeft.value !== 0 && hasInput.value,
  );
  const { submitting, lastSubmissionId, submitNow } = useSubmitRequest({
    problemCode: computed(() => problem.value.code),
    languageId,
    fileMode,
    source,
    chosenFile,
    isReady,
    isContest: computed(
      () => problem.value.contest !== null && problem.value.contest !== undefined,
    ),
    report,
  });
  const { contestProblem } = useContestProblem(() => problem.value, contest);
  const result = useSubmitResult(
    lastSubmissionId,
    computed(() => {
      const inContest = contestProblem.value;
      const precision = contest()?.pointsPrecision ?? 0;
      return {
        problemPoints: problem.value.points,
        contest: inContest
          ? { points: inContest.points, partial: inContest.partial, precision }
          : null,
      };
    }),
  );
  const canSubmit = computed(() => isReady.value && !submitting.value);

  // The viewer's code decides the language: once they have typed, a profile arriving late must not relabel it.
  watch(hasViewerCode, (hasCode) => hasCode && languageState.keepLanguage());

  // The template watcher runs after this tick and sees the prefilled source as the viewer's own code, so it
  // never replaces it, whichever line comes first.
  function prefill(earlier: ResubmitPrefill) {
    source.value = earlier.source;
    if (earlier.languageId) setLanguage(earlier.languageId);
  }
  const { resubmitUnavailable } = useResubmitPrefill(resubmitId, prefill);
  watch(source, () => (resubmitUnavailable.value = false));

  return {
    ...languageState,
    source,
    chosenFile,
    templateRestored,
    chooseFile,
    clearFile,
    loadFile,
    canSubmit,
    length,
    tooLong,
    attemptsLeft,
    submitting,
    lastSubmissionId,
    result,
    errorText,
    resubmitUnavailable,
    submitNow,
  };
}
