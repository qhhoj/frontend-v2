import { computed, ref } from 'vue';
import type { Ref } from 'vue';
import { fetchProblem } from '@/api/problems.api';
import { ApiError } from '@/api/client';
import type { ProblemDetail } from '@/api/types/problems';
import { translate } from '@/i18n';
import { failureTextOf } from '../../ui/admin-errors';
import { MAX_CONTEST_PROBLEMS, newProblemRow } from './contest-problems';
import type { ProblemRow } from './contest-problems';

function lookupFailureText(error: unknown, code: string): string {
  if (error instanceof ApiError && error.code === 'not_found')
    return translate('admin.contests.problems.notFound', { code });
  return failureTextOf(error);
}

/** Adds a problem typed by its code to the end of the list: a missing code, a listed one and a full list each say so. */
export function useAddProblem(rows: Ref<ProblemRow[]>) {
  const addError = ref('');
  const isAdding = ref(false);
  const isFull = computed(() => rows.value.length >= MAX_CONTEST_PROBLEMS);

  function addFound(problem: ProblemDetail): boolean {
    if (rows.value.some((row) => row.problemId === problem.id)) {
      addError.value = translate('admin.contests.problems.alreadyListed', { code: problem.code });
      return false;
    }
    rows.value = [...rows.value, newProblemRow(problem)];
    return true;
  }

  /** True when the code was added; the caller clears its box only then. */
  async function addByCode(code: string): Promise<boolean> {
    if (isFull.value || isAdding.value) return false;
    isAdding.value = true;
    addError.value = '';
    try {
      return addFound(await fetchProblem(code, 'en'));
    } catch (error) {
      addError.value = lookupFailureText(error, code);
      return false;
    } finally {
      isAdding.value = false;
    }
  }

  return { addError, isAdding, isFull, addByCode };
}
