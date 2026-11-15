<script setup lang="ts">
import { computed } from 'vue';
import VerdictChip from '@/components/ui/VerdictChip.vue';
import { GLOBAL_SCOPE } from '@/features/submissions/list/submission-scope';
import { useScopedSubmissionListQuery } from '@/features/submissions/submissions.queries';
import type { SubmissionFilters } from '@/features/submissions/use-submission-filters';
import { formatAgoCompact } from '@/lib/format-date';
import { useNow } from '@/lib/use-now';
import { submissionVerdictOf } from '@/lib/verdicts';
import { useLocaleStore } from '@/stores/locale.store';

/**
 * The peek pane's "Lần nộp gần nhất": the viewer's latest submission to the problem, its verdict linked to it. The query is
 * the problem page's own (same filters, same cache), so opening the problem shows it at once. Nothing while it loads.
 */
const props = defineProps<{ code: string; username: string }>();
const CLOCK_TICK_MS = 60_000;
const locale = useLocaleStore();
const now = useNow(CLOCK_TICK_MS);
const filters = computed<SubmissionFilters>(() => ({
  problem: props.code,
  user: props.username,
  results: [],
  languageIds: [],
  statusGroups: [],
  page: 1,
  live: false,
}));
const { data } = useScopedSubmissionListQuery(GLOBAL_SCOPE, filters);
const latest = computed(() => data.value?.items[0]);
</script>

<template>
  <section v-if="data" class="flex flex-col gap-1.5 rounded-row bg-surface-strong p-3">
    <h3 class="text-meta font-semibold text-secondary">{{ $t('problems.peek.lastSubmission') }}</h3>
    <p v-if="latest" class="flex items-center gap-2 text-sm">
      <RouterLink :to="{ name: 'submission', params: { id: latest.id } }">
        <VerdictChip :verdict="submissionVerdictOf(latest)" named />
      </RouterLink>
      <time :datetime="latest.date" class="ml-auto text-meta text-muted">{{
        formatAgoCompact(latest.date, now, locale.locale)
      }}</time>
    </p>
    <p v-else class="text-sm text-muted">{{ $t('problem.noSubmissions') }}</p>
  </section>
</template>
