<script setup lang="ts">
import CountdownTimer from '@/components/CountdownTimer.vue';
import GlassCard from '@/components/GlassCard.vue';
import QueryState from '@/components/QueryState.vue';
import { useRunningContestQuery } from './home.queries';

const { data: contest, isPending, error, refetch } = useRunningContestQuery();
</script>

<template>
  <GlassCard data-testid="live-contest" class="p-6">
    <QueryState :loading="isPending" :error="error" @retry="refetch()">
      <template v-if="contest">
        <p class="flex items-center gap-2 text-[13px] font-semibold text-accent-text">
          <span aria-hidden="true" class="size-2 rounded-full bg-accent shadow-glow" />
          {{ $t('home.liveContest') }}
        </p>
        <h2 class="mt-2 font-display text-xl font-semibold">{{ contest.name }}</h2>
        <p class="mt-1.5 text-[32px] font-semibold">
          <span class="sr-only">{{ $t('home.endsIn') }}</span>
          <CountdownTimer :until="contest.endTime" @elapsed="refetch()" />
        </p>
        <RouterLink
          :to="{ name: 'contest', params: { key: contest.key } }"
          class="mt-3.5 flex h-12 items-center justify-center rounded-row bg-accent-soft font-bold text-accent-soft-text"
        >
          {{ $t('home.enterContest') }}
        </RouterLink>
      </template>
      <template v-else>
        <h2 class="font-display text-lg font-semibold">{{ $t('home.liveContest') }}</h2>
        <p class="mt-2 text-muted">{{ $t('home.noLiveContest') }}</p>
        <RouterLink
          :to="{ name: 'contests' }"
          class="mt-2 inline-block text-accent-text underline"
          >{{ $t('home.browseContests') }}</RouterLink
        >
      </template>
    </QueryState>
  </GlassCard>
</template>
