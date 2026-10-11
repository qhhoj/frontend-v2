<script setup lang="ts">
import type { SubmissionBatchLog } from '@/api/types/submission-actions';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { formatNumber, formatNumericDateTime } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import { useRecentBatchesQuery } from './batches.queries';

const { data, isPending, error, refetch } = useRecentBatchesQuery();
const locale = useLocaleStore();
const FILTER_KEYS = ['contest', 'problem', 'user', 'judgedOn'] as const;

/** The named parts of a logged filter, `key=value`; a selection by id is told by its size. */
function filterText(entry: SubmissionBatchLog): string {
  const parts = FILTER_KEYS.flatMap((key) =>
    entry.filter[key] ? [`${key}=${entry.filter[key]}`] : [],
  );
  if (entry.filter.results?.length) parts.push(`results=${entry.filter.results.join(',')}`);
  if (entry.filter.ids?.length) parts.push(`ids×${entry.filter.ids.length}`);
  return parts.join(' · ') || '—';
}
</script>

<template>
  <section class="glass flex flex-col gap-3 rounded-panel p-5" aria-labelledby="recent-batches">
    <h2 id="recent-batches" class="font-display text-base font-bold">
      {{ $t('admin.rejudge.history.title') }}
    </h2>
    <QueryState :loading="isPending" :error="error" @retry="refetch()">
      <template #skeleton>
        <SkeletonBlock v-for="index in 3" :key="index" class="h-10 w-full" />
      </template>
      <p v-if="!data?.length" class="text-sm text-muted">{{ $t('admin.rejudge.history.empty') }}</p>
      <ul v-else class="flex flex-col divide-y divide-line text-sm">
        <li v-for="entry in data" :key="entry.id" class="flex flex-col gap-0.5 py-2">
          <span class="flex flex-wrap items-baseline gap-x-2">
            <span class="font-semibold">{{ $t(`admin.rejudge.history.${entry.action}`) }}</span>
            <span class="font-mono">{{ formatNumber(entry.count, locale.locale) }}</span>
            <span class="text-muted">{{ entry.user?.username ?? '—' }}</span>
            <span class="ml-auto text-xs text-muted">{{
              formatNumericDateTime(entry.createdAt, locale.locale)
            }}</span>
          </span>
          <span class="font-mono text-xs break-all text-muted">{{ filterText(entry) }}</span>
        </li>
      </ul>
    </QueryState>
  </section>
</template>
