import { computed, ref } from 'vue';
import { useQueryClient } from '@tanstack/vue-query';
import { useRoute, useRouter } from 'vue-router';
import { ApiError } from '@/api/client';
import type { EditableProblem, ProblemEditingMeta } from '@/api/types/problem-editing';
import { provideDateValidity } from '@/components/ui/date-validity';
import { useDataForm } from '../data/use-data-form';
import { useEditorialForm } from '../editorial/use-editorial-form';
import { failureReasonOf } from '../failure-reason';
import { useProblemForm } from '../general/use-problem-form';
import { useStatementDrafts } from '../statements/use-statement-drafts';
import { isAllSaved, runSaveParts } from './save-parts';
import type { SavePart, SavePartAnswer, SavePartOutcome } from './save-parts';
import type { WorkbenchSectionId } from './workbench-sections';

const failed = (error: ApiError | null): SavePartAnswer =>
  error ? { failure: failureReasonOf(error) } : {};

/**
 * The workbench's forms and their one save. Each section keeps its own draft (info, statements, editorial, judging data);
 * `save()` checks them all, sends the changed ones in the fixed order of `runSaveParts`, reports each part, keeps a failed
 * part's edits, and follows a renamed problem to its new address once every part was tried.
 */
export function useWorkbench(problem: () => EditableProblem, meta: () => ProblemEditingMeta) {
  const route = useRoute();
  const router = useRouter();
  const queryClient = useQueryClient();
  const dates = provideDateValidity();
  const info = useProblemForm(problem, meta, dates);
  const statements = useStatementDrafts(problem);
  const editorial = useEditorialForm(problem);
  const data = useDataForm(() => problem().code);

  /** Partial scoring is a field of the problem, but it is edited in the judging panel and counted there. */
  const partialChange = computed(() => Number(info.form.value.partial !== info.seed.value.partial));
  const changes = computed<Record<'info' | 'statement' | 'tests', number>>(() => ({
    info: info.dirtyCount.value - partialChange.value,
    statement: statements.totalDirtyCount.value + editorial.dirtyCount.value,
    tests: data.dirtyCount.value + partialChange.value,
  }));
  const dirtyCount = computed(
    () => changes.value.info + changes.value.statement + changes.value.tests,
  );

  const isSaving = ref(false);
  const savedAt = ref<Date | null>(null);
  /** The last save's parts, kept on screen while one of them is not saved. */
  const report = ref<SavePartOutcome[] | null>(null);
  /** The sections whose check failed on the last save attempt: the page opens them. */
  const invalidSections = ref<WorkbenchSectionId[]>([]);
  /** True while the page moves to a renamed problem's address: the leave guard must not ask about parts still unsaved. */
  const isFollowingRename = ref(false);

  function checkAll(): WorkbenchSectionId[] {
    const invalid = new Set<WorkbenchSectionId>();
    if (info.dirtyCount.value > 0 && !info.validate())
      invalid.add(info.errors.value.partial ? 'tests' : 'info');
    if (statements.totalDirtyCount.value > 0 && !statements.validate()) invalid.add('statement');
    if (editorial.dirtyCount.value > 0 && !editorial.validate()) invalid.add('statement');
    if (data.dirtyCount.value > 0 && !data.validate()) invalid.add('tests');
    if (data.badRowNumbers.value.length > 0) invalid.add('tests');
    // A date box holding text that is not a date changes no model: both sections with a date box are shown.
    if (dates.hasUnreadableDate.value) invalid.add('info').add('statement');
    return [...invalid];
  }

  /** The problem PATCH: the changed info fields and, in the same request, the original statement when it changed. */
  async function saveProblem(code: string): Promise<SavePartAnswer> {
    const original = statements.originalPatch();
    const answer = await info.saveTo(code, original ?? {});
    if (!answer || answer instanceof ApiError) return failed(answer);
    if (original) statements.markOriginalSaved();
    return { code: answer.code };
  }

  function changedParts(): SavePart[] {
    const parts: SavePart[] = [];
    if (info.dirtyCount.value > 0 || statements.originalPatch())
      parts.push({ id: 'problem', run: saveProblem });
    for (const language of ['vi', 'en'] as const) {
      if (statements.changesBySlot.value[language] === 0) continue;
      parts.push({
        id: `translation.${language}`,
        run: async (code) => failed(await statements.saveTranslation(code, language)),
      });
    }
    if (editorial.dirtyCount.value > 0)
      parts.push({ id: 'editorial', run: async (code) => failed(await editorial.saveTo(code)) });
    if (data.dirtyCount.value > 0)
      parts.push({
        id: 'data',
        run: async (code) => {
          const { failure, feedback } = await data.saveTo(code);
          return failure ? failed(failure) : { warning: feedback.trim() || undefined };
        },
      });
    return parts;
  }

  /** The drafts follow the problem to its new code, then the page does: nothing unsaved is dropped on the way. */
  async function followRename(code: string) {
    statements.retarget(code);
    editorial.retarget(code);
    data.retarget(code);
    await queryClient.refetchQueries({ queryKey: ['admin', 'problem', code] });
    isFollowingRename.value = true;
    try {
      await router.replace({ name: route.name!, params: { code }, query: route.query });
    } finally {
      isFollowingRename.value = false;
    }
  }

  async function save() {
    if (isSaving.value) return;
    invalidSections.value = checkAll();
    if (invalidSections.value.length > 0 || dirtyCount.value === 0) return;
    const startCode = problem().code;
    isSaving.value = true;
    try {
      const run = await runSaveParts(startCode, changedParts());
      report.value =
        isAllSaved(run.outcomes) && !run.outcomes.some((part) => part.note) ? null : run.outcomes;
      if (isAllSaved(run.outcomes)) savedAt.value = new Date();
      if (run.code !== startCode) await followRename(run.code);
    } finally {
      isSaving.value = false;
    }
  }

  function discard() {
    info.discard();
    statements.discard();
    editorial.discard();
    data.discard();
    report.value = null;
    invalidSections.value = [];
  }

  return {
    info,
    statements,
    editorial,
    data,
    changes,
    dirtyCount,
    /** What the leave guard counts: nothing while the page follows a rename it made itself. */
    guardedCount: computed(() => (isFollowingRename.value ? 0 : dirtyCount.value)),
    hasUnreadableDate: dates.hasUnreadableDate,
    isSaving,
    savedAt,
    report,
    invalidSections,
    save,
    discard,
  };
}
export type Workbench = ReturnType<typeof useWorkbench>;
