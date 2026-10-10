<script setup lang="ts">
import { computed } from 'vue';
import BitMascot from '@/components/BitMascot.vue';
import GlassCard from '@/components/GlassCard.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { formatNumber } from '@/lib/format';
import { PLACEMENT_LOOKS } from '@/mascot/bit-sprite';
import { useLocaleStore } from '@/stores/locale.store';
import { useHomeQuery } from '@/features/community/community.queries';

/** The counts come from `GET /home`; the hero itself never waits for them, and hides the counts when it fails. */
const locale = useLocaleStore();
const { data: home, isPending, isError } = useHomeQuery();
const counts = computed(() => home.value?.counts ?? null);
const COUNT_KEYS = ['users', 'problems', 'submissions', 'contests'] as const;
const formatCount = (value: number) => formatNumber(value, locale.locale);
</script>

<template>
  <GlassCard
    data-testid="anonymous-hero"
    class="flex flex-wrap items-center gap-6 p-6 sm:flex-nowrap sm:gap-8 sm:p-8"
  >
    <div class="flex min-w-0 flex-1 flex-col gap-3">
      <p class="text-sm font-semibold text-accent-text">{{ $t('home.anon.eyebrow') }}</p>
      <h1 class="page-title">
        {{ $t('home.anon.title') }}
      </h1>
      <p v-if="!isError" class="max-w-2xl text-muted">
        <template v-if="counts">
          {{ $t('home.anon.body', { problems: formatCount(counts.problems) }) }}
        </template>
        <SkeletonBlock v-else-if="isPending" text class="inline-block h-4 w-72 align-middle" />
      </p>
      <div class="flex flex-wrap gap-2.5">
        <RouterLink
          to="/register"
          class="bg-gradient-accent inline-flex min-h-11 items-center rounded-pill px-5 font-semibold text-on-accent"
          >{{ $t('home.anon.register') }}</RouterLink
        >
        <RouterLink
          to="/login"
          class="inline-flex min-h-11 items-center rounded-pill border border-line bg-surface-solid px-5 font-semibold text-content hover:bg-surface-hover"
          >{{ $t('home.anon.signIn') }}</RouterLink
        >
        <RouterLink
          to="/problems"
          class="inline-flex min-h-11 items-center px-3 font-semibold text-accent-text hover:underline"
          >{{ $t('home.anon.problems') }}</RouterLink
        >
      </div>
      <dl v-if="!isError" data-testid="home-counts" class="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div v-for="key in COUNT_KEYS" :key="key" class="flex flex-col">
          <dt class="text-sm text-muted">{{ $t(`home.anon.counts.${key}`) }}</dt>
          <dd class="font-mono text-lg font-semibold tabular-nums">
            <span v-if="counts">{{ formatCount(counts[key]) }}</span>
            <SkeletonBlock
              v-else-if="isPending"
              text
              data-skeleton-region="counts"
              class="h-5 w-16"
            />
          </dd>
        </div>
      </dl>
    </div>
    <BitMascot
      data-testid="home-bit"
      :look="PLACEMENT_LOOKS.hero"
      blinks
      :label="$t('home.anon.bit')"
      class="shrink-0 [--bit-px:6px] sm:[--bit-px:9px]"
    />
  </GlassCard>
</template>
