<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue';
import { computed } from 'vue';
import BitMascot from '@/components/BitMascot.vue';
import Card from '@/components/ui/Card.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { formatNumber } from '@/lib/format';
import { PLACEMENT_LOOKS } from '@/mascot/bit-sprite';
import { useLocaleStore } from '@/stores/locale.store';
import { useHomeQuery } from '@/features/community/community.queries';

/**
 * The counts come from `GET /home`; the hero itself never waits for them, and hides the counts when it fails. On phones (P-05
 * note) the hero is short so the running contest and the first post are on the first screen: no counts, one primary
 * ("Đăng ký tài khoản") with a text "Đăng nhập" (the menu sheet has the sign-in too), and a small Bit beside the title.
 */
const locale = useLocaleStore();
const { data: home, isPending, isError } = useHomeQuery();
const counts = computed(() => home.value?.counts ?? null);
const COUNT_KEYS = ['users', 'problems', 'submissions', 'contests'] as const;
const formatCount = (value: number) => formatNumber(value, locale.locale);
</script>

<template>
  <Card
    data-testid="anonymous-hero"
    class="flex flex-wrap items-center gap-6 p-6 sm:flex-nowrap sm:gap-8 sm:p-8"
  >
    <div class="flex min-w-0 flex-1 flex-col gap-3">
      <div class="flex items-center justify-between gap-3">
        <h1 class="page-title">
          {{ $t('home.anon.title') }}
        </h1>
        <BitMascot
          data-testid="home-bit-phone"
          :look="PLACEMENT_LOOKS.hero"
          :label="$t('home.anon.bit')"
          class="shrink-0 [--bit-px:3px] sm:hidden"
        />
      </div>
      <p class="max-w-2xl text-muted">{{ $t('home.anon.body') }}</p>
      <div class="flex flex-wrap gap-2.5">
        <AppButton tone="primary" to="/register">{{ $t('home.anon.register') }}</AppButton>
        <AppButton to="/login" class="max-sm:hidden">{{ $t('home.anon.signIn') }}</AppButton>
        <RouterLink
          to="/login"
          class="inline-flex min-h-11 items-center px-3 font-semibold text-accent-text hover:underline sm:hidden"
          >{{ $t('home.anon.signIn') }}</RouterLink
        >
        <RouterLink
          to="/problems"
          class="inline-flex min-h-11 items-center px-3 font-semibold text-accent-text hover:underline"
          >{{ $t('home.anon.problems') }}</RouterLink
        >
      </div>
      <dl v-if="!isError" data-testid="home-counts" class="grid gap-3 max-sm:hidden sm:grid-cols-4">
        <div v-for="key in COUNT_KEYS" :key="key" class="flex flex-col">
          <dt class="text-sm text-muted">{{ $t(`home.anon.counts.${key}`) }}</dt>
          <dd class="font-mono text-subtitle leading-7 font-semibold tabular-nums">
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
      class="shrink-0 [--bit-px:9px] max-sm:hidden"
    />
  </Card>
</template>
