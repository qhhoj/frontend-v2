<script setup lang="ts">
import BitLoop from '@/components/BitLoop.vue';
import AppButton from '@/components/ui/AppButton.vue';
import Chip from '@/components/ui/Chip.vue';
import ProgressBar from '@/components/ui/ProgressBar.vue';
import { computed } from 'vue';
import type { ContestListItem } from '@/api/types/contests';
import SeeAllLink from '@/components/ui/SeeAllLink.vue';
import Card from '@/components/ui/Card.vue';
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
  <Card data-testid="running-contests" padding="lg" :title="$t('home.anon.running')">
    <template #actions>
      <!-- The 32 px Bit of a running contest; the negative margin keeps the header's height when it arrives. -->
      <BitLoop
        v-if="contests.length"
        data-testid="contest-bit"
        kind="contest"
        class="-my-1.5 [--bit-px:2px]"
      />
      <Chip size="md" class="font-mono tabular-nums">{{ contests.length }}</Chip>
      <SeeAllLink :to="{ name: 'contests' }">{{ $t('home.anon.allContests') }}</SeeAllLink>
    </template>
    <QueryState :loading="isPending" :error="error" @retry="refetch()">
      <template #skeleton>
        <div data-skeleton-region="running-contest" class="grid gap-3 md:grid-cols-2">
          <!-- Measured against the loaded articles: one column on a phone, two on desktop. -->
          <SkeletonBlock v-for="row in 2" :key="row" class="h-[264px] w-full md:h-[232px]" />
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
          <h3 class="font-display text-subtitle leading-7 font-semibold">
            <RouterLink
              :to="{ name: 'contest', params: { key: contest.key } }"
              class="hover:text-accent-text"
              >{{ contest.name }}</RouterLink
            >
          </h3>
          <p class="font-mono text-meta text-muted">
            {{
              $t('home.anon.contestants', {
                key: contest.key,
                count: formatNumber(contest.userCount, locale.locale),
              })
            }}
          </p>
          <ProgressBar
            :value="percentOf(contest)"
            :label="$t('home.anon.elapsed', { percent: percentOf(contest) })"
          />
          <p class="text-sm font-semibold">
            {{ $t('contests.list.timeLeft', { span: timeLeftOf(contest) }) }}
          </p>
          <AppButton :to="{ name: 'contest', params: { key: contest.key } }" class="self-start">{{
            $t('home.anon.viewContest')
          }}</AppButton>
        </article>
      </div>
      <div v-else class="flex flex-wrap items-center gap-3 py-2">
        <StateBit variant="contest" size="inline" />
        <p class="text-muted">{{ $t('home.noLiveContest') }}</p>
        <SeeAllLink :to="{ name: 'contests' }">{{ $t('home.browseContests') }}</SeeAllLink>
      </div>
    </QueryState>
  </Card>
</template>
