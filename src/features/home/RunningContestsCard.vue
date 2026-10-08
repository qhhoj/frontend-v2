<script setup lang="ts">
import { computed } from 'vue';
import type { ContestListItem } from '@/api/types/contests';
import GlassCard from '@/components/GlassCard.vue';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import StateBit from '@/components/StateBit.vue';
import ContestChips from '@/features/contests/ContestChips.vue';
import PhasePill from '@/features/contests/PhasePill.vue';
import { useSpanText } from '@/features/contests/use-span-text';
import { useRunningContestsQuery } from '@/features/community/community.queries';
import { contestProgress, spanMessage } from '@/lib/contest-time';
import { formatNumber } from '@/lib/format';
import { useNow } from '@/lib/use-now';
import { useLocaleStore } from '@/stores/locale.store';

/** Two running contests at most; the bar and the time left move every 30 s, which is a minute's precision. */
const { data, isPending, error, refetch } = useRunningContestsQuery(2);
const contests = computed(() => data.value?.items ?? []);
const now = useNow(30_000);
const locale = useLocaleStore();
const spanText = useSpanText();
const percentOf = (contest: ContestListItem) =>
  Math.round(contestProgress(contest, now.value) * 100);
const timeLeftOf = (contest: ContestListItem) =>
  spanText(spanMessage((Date.parse(contest.endTime) - now.value) / 1000));
</script>

<template>
  <GlassCard data-testid="running-contests" class="flex flex-col gap-4 p-5 sm:p-6">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <h2 class="flex items-center gap-2 font-display text-lg font-semibold">
        {{ $t('home.anon.running') }}
        <span class="rounded-pill bg-surface-strong px-2 font-mono text-sm tabular-nums">{{
          contests.length
        }}</span>
      </h2>
      <RouterLink :to="{ name: 'contests' }" class="font-semibold text-accent-text hover:underline">
        {{ $t('home.anon.allContests') }}
      </RouterLink>
    </div>
    <QueryState :loading="isPending" :error="error" @retry="refetch()">
      <template #skeleton>
        <div data-skeleton-region="running-contest" class="grid gap-3 md:grid-cols-2">
          <SkeletonBlock v-for="row in 2" :key="row" class="h-60 w-full" />
        </div>
      </template>
      <div v-if="contests.length" class="grid gap-3 md:grid-cols-2">
        <article
          v-for="contest in contests"
          :key="contest.key"
          class="flex flex-col gap-2.5 rounded-card border border-line p-4"
        >
          <div class="flex flex-wrap items-center gap-1.5">
            <PhasePill phase="running" />
            <ContestChips :contest="contest" />
          </div>
          <h3 class="font-display text-lg font-semibold">
            <RouterLink
              :to="{ name: 'contest', params: { key: contest.key } }"
              class="hover:text-accent-text"
              >{{ contest.name }}</RouterLink
            >
          </h3>
          <p class="font-mono text-[13px] text-muted">
            {{
              $t('home.anon.contestants', {
                key: contest.key,
                count: formatNumber(contest.userCount, locale.locale),
              })
            }}
          </p>
          <div
            role="img"
            :aria-label="$t('home.anon.elapsed', { percent: percentOf(contest) })"
            class="h-2 overflow-hidden rounded-pill bg-surface-hover"
          >
            <div
              class="h-full rounded-pill bg-gradient-accent"
              :style="{ width: `${percentOf(contest)}%` }"
            />
          </div>
          <p class="text-sm font-semibold">
            {{ $t('contests.list.timeLeft', { span: timeLeftOf(contest) }) }}
          </p>
          <RouterLink
            :to="{ name: 'contest', params: { key: contest.key } }"
            class="inline-flex min-h-11 items-center self-start rounded-pill border border-line px-4 font-semibold hover:bg-surface-hover"
            >{{ $t('home.anon.viewContest') }}</RouterLink
          >
        </article>
      </div>
      <div v-else class="flex flex-wrap items-center gap-3 py-2">
        <StateBit variant="contest" size="inline" />
        <p class="text-muted">{{ $t('home.noLiveContest') }}</p>
        <RouterLink
          :to="{ name: 'contests' }"
          class="font-semibold text-accent-text hover:underline"
        >
          {{ $t('home.browseContests') }}
        </RouterLink>
      </div>
    </QueryState>
  </GlassCard>
</template>
