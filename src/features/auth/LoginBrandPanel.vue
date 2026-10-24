<script setup lang="ts">
import BitLoop from '@/components/BitLoop.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import { useSiteCountsQuery } from './auth.queries';

/**
 * The auth shell's brand panel: the left half from xl, a band over the form below it. The top bar carries the
 * wordmark, so the panel holds only Bit, the headline and the counts. Decoration next to a working form: no `QueryState`, no registered
 * wait; a block holds the counts line while it loads, a failure leaves the line empty.
 */
const locale = useLocaleStore();
const { data: counts, isPending } = useSiteCountsQuery();
const show = (value: number) => formatNumber(value, locale.locale);
</script>

<template>
  <aside
    class="grid grid-cols-[auto_1fr] items-center gap-x-3.5 bg-accent-soft px-4 py-4 sm:px-8 xl:flex xl:flex-col xl:items-start xl:justify-between xl:p-12"
  >
    <BitLoop data-testid="login-bit" kind="welcome" class="row-span-2 [--bit-px:5px] xl:hidden" />
    <p class="font-display text-subtitle leading-snug font-bold xl:hidden">
      {{ $t('auth.brand.headline') }}
    </p>
    <!-- Keeps the counts at the panel's foot from xl. -->
    <span aria-hidden="true" class="hidden xl:block" />
    <div class="hidden xl:flex xl:flex-col xl:gap-7">
      <BitLoop data-testid="login-bit" kind="welcome" class="[--bit-px:14px]" />
      <div>
        <p class="max-w-[460px] font-display text-[34px] leading-[1.15] font-bold">
          {{ $t('auth.brand.headline') }}
        </p>
        <p class="mt-3 max-w-[460px] text-base leading-relaxed text-muted">
          {{ $t('auth.brand.lead') }}
        </p>
      </div>
    </div>
    <p
      data-testid="site-counts"
      class="min-h-5 font-mono text-xs text-muted tabular-nums xl:text-sm"
    >
      <SkeletonBlock v-if="isPending" text class="w-40" />
      <template v-else-if="counts">{{
        $t('auth.brand.counts', { problems: show(counts.problems), users: show(counts.users) })
      }}</template>
    </p>
  </aside>
</template>
