import { computed, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import { useProblemMetaQuery } from '@/features/problems/problems.queries';
import { translate } from '@/i18n';
import { describeActiveFilters } from '../describe-active-filters';
import { FIRST_PAGE } from '../live-passes';
import { useScopedSubmissionListQuery } from '../submissions.queries';
import { useLiveSubmissionList } from '../use-live-submission-list';
import { useSubmissionFilters } from '../use-submission-filters';
import { useSessionStore } from '@/stores/session.store';
import { useInFlightPoll } from './use-in-flight-poll';
import { fixedUserOf } from './submission-scope';
import type { SubmissionScope } from './submission-scope';

/**
 * Everything a submission list does besides drawing: the URL's filters, the scope's page, live updates (the feed, plus
 * page reads while rows with a test strip are judged) and the empty text. Every list (the site's, an organization's, a contest's) runs this one copy.
 */
export function useSubmissionList(options: {
  scope: MaybeRefOrGetter<SubmissionScope>;
  enabled: MaybeRefOrGetter<boolean>;
  /** The unfiltered empty text's i18n key. */
  emptyKey: MaybeRefOrGetter<string>;
}) {
  const scope = computed(() => toValue(options.scope));
  const { filters: urlFilters, update, reset } = useSubmissionFilters();
  /** A pinned user replaces the URL's, so the chips, the count and the empty text describe what is shown. */
  const filters = computed(() => {
    const fixedUser = fixedUserOf(scope.value);
    return fixedUser === null ? urlFilters.value : { ...urlFilters.value, user: '' };
  });
  const { data: meta } = useProblemMetaQuery();
  const listQuery = useScopedSubmissionListQuery(scope, urlFilters, options.enabled);
  const rows = computed(() => listQuery.data.value?.items ?? []);
  const isLive = computed(() => toValue(options.enabled) && urlFilters.value.live);
  const refetchRows = async () => (await listQuery.refetch()).data?.items;
  const live = useLiveSubmissionList({
    scope,
    filters: urlFilters,
    rows,
    total: computed(() =>
      listQuery.isPlaceholderData.value ? undefined : listQuery.data.value?.meta.total,
    ),
    enabled: isLive,
    refetchRows,
    goToFirstPage: () => update({ page: FIRST_PAGE }),
  });
  const session = useSessionStore();
  useInFlightPoll({
    rows,
    enabled: computed(() => isLive.value && session.status === 'authenticated'),
    refetchRows,
  });
  const languages = computed(() => meta.value?.languages ?? []);
  const emptyText = computed(() => {
    const active = describeActiveFilters(filters.value, languages.value);
    return active
      ? translate('submissions.emptyFiltered', { filters: active })
      : translate(toValue(options.emptyKey));
  });
  return { filters, update, reset, listQuery, rows, live, languages, emptyText };
}
