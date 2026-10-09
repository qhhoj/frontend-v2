import { computed, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import { useContestQuery } from './contests.queries';
import { switcherEntries } from './problem-switcher';

/** The contest and rail rows for a problem page; `entries` stays null until the contest loaded and lists the problem. */
export function useProblemRail(
  contestKey: MaybeRefOrGetter<string | null>,
  currentCode: MaybeRefOrGetter<string>,
) {
  const { data: contest } = useContestQuery(
    () => toValue(contestKey) ?? '',
    () => toValue(contestKey) !== null,
  );
  const entries = computed(() =>
    contest.value ? switcherEntries(contest.value.problems, toValue(currentCode)) : null,
  );
  return { contest, entries };
}
