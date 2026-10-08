<script setup lang="ts">
import EmptyState from '@/components/EmptyState.vue';
import GlassCard from '@/components/GlassCard.vue';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import VerdictBadge from '@/components/VerdictBadge.vue';
import { formatRelative } from '@/lib/format';
import { useNow } from '@/lib/use-now';
import { verdictOf } from '@/lib/verdicts';
import { useLocaleStore } from '@/stores/locale.store';
import { useRecentSubmissionsQuery } from './home.queries';

const props = defineProps<{ username: string }>();
const {
  data: submissions,
  isPending,
  error,
  refetch,
} = useRecentSubmissionsQuery(() => props.username);
const locale = useLocaleStore();
const now = useNow(60_000);
</script>

<template>
  <GlassCard data-testid="recent-submissions" class="p-6">
    <div class="flex items-center justify-between">
      <h2 class="font-display text-lg font-semibold">{{ $t('home.recentSubmissions') }}</h2>
      <RouterLink
        :to="{ name: 'submissions', query: { user: username } }"
        class="text-accent-text hover:underline"
        >{{ $t('common.viewAll') }}</RouterLink
      >
    </div>
    <QueryState :loading="isPending" :error="error" @retry="refetch()">
      <template #skeleton>
        <ul class="mt-3.5 flex flex-col gap-2">
          <li
            v-for="row in 4"
            :key="row"
            class="flex flex-wrap items-center gap-x-3.5 gap-y-1 rounded-row bg-surface px-3.5 py-3"
          >
            <SkeletonBlock round class="size-10 shrink-0" />
            <span class="min-w-32 flex-1">
              <span class="block font-semibold"><SkeletonBlock text class="w-2/3" /></span>
              <span class="block text-[13px]"><SkeletonBlock text class="w-1/3" /></span>
            </span>
            <span class="ml-auto font-mono text-[13px]"><SkeletonBlock text class="w-24" /></span>
          </li>
        </ul>
      </template>

      <EmptyState v-if="!submissions?.length" compact>{{ $t('home.noSubmissions') }}</EmptyState>
      <ul v-else class="mt-3.5 flex flex-col gap-2">
        <li v-for="item in submissions" :key="item.id">
          <RouterLink
            :to="{ name: 'submission', params: { id: item.id } }"
            class="flex flex-wrap items-center gap-x-3.5 gap-y-1 rounded-row bg-surface px-3.5 py-3 text-content hover:bg-surface-hover"
          >
            <VerdictBadge :verdict="verdictOf(item)" />
            <span class="min-w-32 flex-1">
              <span class="block truncate font-semibold">{{ item.problem?.name ?? '—' }}</span>
              <span class="block text-[13px] text-muted"
                >{{ $t(verdictOf(item).labelKey) }} · {{ item.language?.name ?? '—' }}</span
              >
            </span>
            <span class="ml-auto text-right font-mono text-[13px] text-muted">
              {{ item.time !== null ? `${item.time.toFixed(2)}s · ` : ''
              }}{{ formatRelative(item.date, now, locale.locale) }}
            </span>
          </RouterLink>
        </li>
      </ul>
    </QueryState>
  </GlassCard>
</template>
