<script setup lang="ts">
import { computed } from 'vue';
import type { SubmissionListItem } from '@/api/types/submissions';
import EmptyState from '@/components/EmptyState.vue';
import LanguageLabel from '@/components/language/LanguageLabel.vue';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { CUE_TEXT } from '@/components/ui/cue-tones';
import PageSection from '@/components/ui/PageSection.vue';
import SeeAllLink from '@/components/ui/SeeAllLink.vue';
import StretchedLink from '@/components/ui/StretchedLink.vue';
import VerdictChip from '@/components/ui/VerdictChip.vue';
import { useInFlightPoll } from '@/features/submissions/list/use-in-flight-poll';
import { scoreCellText, scoreCue } from '@/features/submissions/submission-row';
import { NO_VALUE } from '@/lib/format';
import { formatRelative } from '@/lib/format-date';
import { useNow } from '@/lib/use-now';
import { submissionVerdictOf } from '@/lib/verdicts';
import { useLocaleStore } from '@/stores/locale.store';
import { useRecentSubmissionsQuery } from './home.queries';

/**
 * "Bài nộp gần đây của bạn": the newest submissions of the viewer, one row each, a link as a whole: verdict, score in
 * its cue, problem, language, time. On a phone the score sits under the verdict and the language is left out. The
 * query is shared with "Làm tiếp", so it is one request. A queued or grading row is read again by the same in-flight
 * poll the submission list uses, so its verdict and score settle without a reload.
 */
const VISIBLE = 5;
const PROBLEMS = { name: 'problems' };
const props = defineProps<{ username: string }>();
const {
  data: submissions,
  isPending,
  error,
  refetch,
} = useRecentSubmissionsQuery(() => props.username);
const locale = useLocaleStore();
const now = useNow(60_000);
const visible = computed(() => (submissions.value ?? []).slice(0, VISIBLE));
useInFlightPoll({
  rows: computed(() => submissions.value ?? []),
  enabled: computed(() => true),
  refetchRows: async () => (await refetch()).data,
});
const scoreClass = (item: SubmissionListItem) => {
  const cue = scoreCue(item, undefined);
  return cue ? CUE_TEXT[cue] : 'text-muted';
};
const scoreOf = (item: SubmissionListItem) => scoreCellText(item, locale.locale, undefined, true);
const ROW = 'flex min-h-(--qh-row) items-center gap-3 px-2 touch:min-h-13';
</script>

<template>
  <PageSection
    data-testid="recent-submissions"
    :title="$t('home.recentSubmissions')"
    :see-all="{
      to: { name: 'submissions', query: { user: username } },
      label: $t('common.viewAll'),
    }"
  >
    <QueryState :loading="isPending" :error="error" @retry="refetch()">
      <template #skeleton>
        <ul class="flex flex-col divide-y divide-line">
          <li v-for="row in VISIBLE" :key="row" :class="ROW">
            <SkeletonBlock text class="w-15" />
            <span class="min-w-0 flex-1"><SkeletonBlock text class="w-2/3" /></span>
            <SkeletonBlock text class="w-16" />
          </li>
        </ul>
      </template>
      <EmptyState v-if="!visible.length" inline>
        <template #default>{{ $t('home.noSubmissions') }}</template>
        <template #action>
          <SeeAllLink :to="PROBLEMS">{{ $t('home.anon.problems') }}</SeeAllLink>
        </template>
      </EmptyState>
      <ul v-else class="flex flex-col divide-y divide-line">
        <li v-for="item in visible" :key="item.id" class="box-link" :class="ROW">
          <span class="flex shrink-0 flex-col max-sm:w-24 sm:flex-row sm:items-center sm:gap-3">
            <VerdictChip :verdict="submissionVerdictOf(item)" />
            <span
              class="font-mono text-small tabular-nums sm:w-24 sm:text-right"
              :class="scoreClass(item)"
              >{{ scoreOf(item) }}</span
            >
          </span>
          <StretchedLink
            :to="{ name: 'submission', params: { id: item.id } }"
            class="min-w-0 flex-1 truncate font-medium text-content"
            >{{ item.problem?.name ?? NO_VALUE }}</StretchedLink
          >
          <LanguageLabel
            v-if="item.language"
            :language="item.language"
            class="shrink-0 text-small text-muted max-md:hidden"
          />
          <span class="w-24 shrink-0 text-right text-small whitespace-nowrap text-muted">
            {{ formatRelative(item.date, now, locale.locale) }}
          </span>
        </li>
      </ul>
    </QueryState>
  </PageSection>
</template>
