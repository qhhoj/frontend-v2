<script setup lang="ts">
import CountdownTimer from '@/components/CountdownTimer.vue';
import BitLoop from '@/components/BitLoop.vue';
import EmptyState from '@/components/EmptyState.vue';
import GlassCard from '@/components/GlassCard.vue';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { useRunningContestQuery } from './home.queries';

const { data: contest, isPending, error, refetch } = useRunningContestQuery();
</script>

<template>
  <GlassCard data-testid="live-contest" class="border-line-accent! p-6">
    <QueryState :loading="isPending" :error="error" @retry="refetch()">
      <template #skeleton>
        <div class="flex items-start gap-4">
          <div class="min-w-0 flex-1">
            <p data-skeleton-region="label" class="text-[13px] font-semibold">
              <SkeletonBlock text class="w-28" />
            </p>
            <h2 data-skeleton-region="name" class="mt-2 font-display text-xl font-semibold">
              <SkeletonBlock text class="w-3/4" />
            </h2>
            <p data-skeleton-region="countdown" class="mt-1.5 text-[32px] font-semibold">
              <SkeletonBlock text class="w-2/3" />
            </p>
          </div>
          <!-- The running contest's Bit (32 px) keeps this slot, so the card does not move when it arrives. -->
          <SkeletonBlock data-skeleton-region="bit" class="size-8 shrink-0" />
        </div>
        <SkeletonBlock data-skeleton-region="enter" class="mt-3.5 h-12 w-full" />
      </template>

      <template v-if="contest">
        <div class="flex items-start gap-4">
          <div class="min-w-0 flex-1">
            <p class="flex items-center gap-2 text-[13px] font-semibold text-accent-text">
              <span aria-hidden="true" class="size-2 rounded-full bg-accent shadow-glow" />
              {{ $t('home.liveContest') }}
            </p>
            <h2 class="mt-2 font-display text-xl font-semibold">{{ contest.name }}</h2>
            <p class="mt-1.5 text-[32px] font-semibold">
              <span class="sr-only">{{ $t('home.endsIn') }}</span>
              <CountdownTimer :until="contest.endTime" @elapsed="refetch()" />
            </p>
          </div>
          <BitLoop data-testid="contest-bit" kind="contest" class="[--bit-px:2px]" />
        </div>
        <RouterLink
          :to="{ name: 'contest', params: { key: contest.key } }"
          class="mt-3.5 flex h-12 items-center justify-center rounded-row bg-accent-soft font-bold text-accent-soft-text"
        >
          {{ $t('home.enterContest') }}
        </RouterLink>
      </template>
      <template v-else>
        <h2 class="font-display text-base leading-7 font-bold">{{ $t('home.liveContest') }}</h2>
        <EmptyState compact>{{ $t('home.noLiveContest') }}</EmptyState>
        <!-- mt-5 is tuned so the empty card is as tall as its skeleton (whose enter button sits below a gap). -->
        <RouterLink
          :to="{ name: 'contests' }"
          class="mt-5 inline-block text-accent-text underline"
          >{{ $t('home.browseContests') }}</RouterLink
        >
      </template>
    </QueryState>
  </GlassCard>
</template>
