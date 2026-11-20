import { computed, ref, watch } from 'vue';
import type { Ref } from 'vue';
import { useQueryClient } from '@tanstack/vue-query';
import type { EditableProblem } from '@/api/types/problem-editing';
import { useSubmitForm } from '@/features/problems/use-submit-form';
import { GLOBAL_SCOPE } from '@/features/submissions/list/submission-scope';
import { useScopedSubmissionListQuery } from '@/features/submissions/submissions.queries';
import { useLiveSubmission } from '@/features/submissions/use-live-submission';
import type { SubmissionFilters } from '@/features/submissions/use-submission-filters';
import { translate } from '@/i18n';
import { followedVerdictOf } from '@/lib/verdicts';
import { useSessionStore } from '@/stores/session.store';
import { useViewerId } from '@/stores/use-viewer-id';
import { editableProblemKey, PROBLEM_INDEX_KEY } from '../../problem-editing.queries';
import type { Workbench } from '../use-workbench';
import { countDataChanges, toDataForm } from '../../data/test-cases';
import { trialResultsOf } from '../../data/trial-results';

const KEY = 'admin.problems.workbench.trial';
/** How many of the viewer's runs the section lists. */
const SHOWN_RUNS = 5;

/**
 * The workbench's trial run: a model solution sent through the site's own submit (the student form's state and checks),
 * the run on show, and the viewer's last runs. The run on show is the last one sent from this page; after a reload it is
 * the viewer's newest submission to the problem (`GET /submissions?problem=&user=`, then `GET /submissions/{id}` for
 * its tests). A run judges what is saved, so nothing is sent while the page has unsaved changes.
 *
 * Whether a run is older than the tests is known only for changes made on this page (a save of the judging data, a new
 * archive): the API dates neither the test data nor what a run was judged on.
 */
export function useTrialRun(
  problem: () => EditableProblem,
  workbench: Pick<Workbench, 'data' | 'changes' | 'dirtyCount'>,
) {
  const session = useSessionStore();
  const viewer = useViewerId();
  const queryClient = useQueryClient();
  const { data } = workbench;

  const hasSavedTests = computed(
    () =>
      problem().externalJudge !== null ||
      (data.saved.value?.cases ?? []).some((testCase) => testCase.type === 'C'),
  );
  const blocker = () => {
    if (workbench.dirtyCount.value > 0) return translate(`${KEY}.blocked.unsaved`);
    if (data.saved.value && !hasSavedTests.value) return translate(`${KEY}.blocked.noTests`);
    return null;
  };
  const noResubmit: Ref<string | null> = ref(null);
  const form = useSubmitForm(computed(problem), noResubmit, () => null, blocker);

  const filters = computed<SubmissionFilters>(() => ({
    problem: problem().code,
    user: session.user?.username ?? '',
    results: [],
    languageIds: [],
    statusGroups: [],
    page: 1,
    live: false,
  }));
  const list = useScopedSubmissionListQuery(GLOBAL_SCOPE, filters);
  const runs = computed(() => list.data.value?.items.slice(0, SHOWN_RUNS) ?? []);

  const isPageRun = computed(() => form.lastSubmissionId.value !== null);
  /** The form follows the run sent from this page; only a run from before the page was opened is followed here. */
  const earlierId = computed(() => (isPageRun.value ? '' : (list.data.value?.items[0]?.id ?? '')));
  const earlier = useLiveSubmission(earlierId);
  const earlierRun = computed(() => (earlierId.value ? earlier.submission.data.value : undefined));
  const run = computed(() => (isPageRun.value ? form.result.row.value : earlierRun.value));
  const verdict = computed(() => {
    if (isPageRun.value) return form.result.verdict.value;
    return earlierRun.value ? followedVerdictOf(earlier.live.status, earlierRun.value) : null;
  });
  const isLive = computed(() =>
    isPageRun.value ? form.result.isLive.value : earlier.isLive.value,
  );
  const currentTestcase = computed(() =>
    isPageRun.value
      ? form.result.step.value.test
      : earlier.live.currentTestcase || (earlierRun.value?.currentTestcase ?? 0),
  );

  const shownId = computed(() => form.lastSubmissionId.value ?? (earlierId.value || null));
  /** The run on show when the stored tests last changed on this page: it was judged on the tests before the change. */
  const outdatedRunId = ref<string | null>(null);
  const markTestsChanged = () => {
    outdatedRunId.value = shownId.value;
  };
  // The stored configuration changes on a save and when the server's differs (a sync). Its first read is no change, and
  // neither is the same configuration read again (discarded edits put the server's copy back).
  watch(data.saved, (now, before) => {
    if (now && before && countDataChanges(toDataForm(now), toDataForm(before)) > 0)
      markTestsChanged();
  });
  /** Unsaved edits to the tests count too: the rows no longer line up with the run's. */
  const isStale = computed(
    () =>
      run.value !== undefined &&
      (workbench.changes.value.tests > 0 || outdatedRunId.value === shownId.value),
  );
  const results = computed(() => trialResultsOf(run.value, isStale.value));

  // An accepted run finishes the trial step: the problem (its `viewerStatus`) and the lists' marks are read again.
  watch(
    () => form.result.isFinished.value,
    (isFinished, before) => {
      if (!isFinished || before !== false) return;
      void queryClient.invalidateQueries({
        queryKey: editableProblemKey(problem().code, viewer.value),
      });
      void queryClient.invalidateQueries({ queryKey: PROBLEM_INDEX_KEY });
    },
  );

  return {
    form,
    run,
    verdict,
    isLive,
    currentTestcase,
    isPageRun,
    isStale,
    results,
    runs,
    list,
    markTestsChanged,
  };
}
export type TrialRun = ReturnType<typeof useTrialRun>;
