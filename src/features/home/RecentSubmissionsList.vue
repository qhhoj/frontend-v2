<script setup lang="ts">
import { computed } from 'vue';
import EmptyState from '@/components/EmptyState.vue';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import PageSection from '@/components/ui/PageSection.vue';
import SeeAllLink from '@/components/ui/SeeAllLink.vue';
import VerdictChip from '@/components/ui/VerdictChip.vue';
import { formatNumber } from '@/lib/format';
import { formatRelative } from '@/lib/format-date';
import { useNow } from '@/lib/use-now';
import { submissionVerdictOf } from '@/lib/verdicts';
import { useLocaleStore } from '@/stores/locale.store';
import { useRecentSubmissionsQuery } from './home.queries';

/** "Bài nộp của bạn": the five newest submissions of the viewer, one ledger row each (verdict, problem, score, time); the query is shared with "Làm tiếp", so it is one request. */
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
          <li v-for="row in VISIBLE" :key="row" class="flex items-center gap-3 py-2">
            <SkeletonBlock round class="size-7 shrink-0" />
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
        <li v-for="item in visible" :key="item.id">
          <RouterLink
            :to="{ name: 'submission', params: { id: item.id } }"
            class="flex min-h-(--qh-row) items-center gap-3 text-content hover:bg-surface-hover touch:min-h-11"
          >
            <VerdictChip :verdict="submissionVerdictOf(item)" />
            <span class="min-w-0 flex-1 truncate font-medium">{{ item.problem?.name ?? '—' }}</span>
            <span
              v-if="item.caseTotal > 0"
              class="shrink-0 font-mono text-meta text-muted max-sm:hidden"
              >{{ formatNumber(item.casePoints, locale.locale) }} /
              {{ formatNumber(item.caseTotal, locale.locale) }}</span
            >
            <span class="w-24 shrink-0 text-right text-meta whitespace-nowrap text-muted">
              {{ formatRelative(item.date, now, locale.locale) }}
            </span>
          </RouterLink>
        </li>
      </ul>
    </QueryState>
  </PageSection>
</template>
