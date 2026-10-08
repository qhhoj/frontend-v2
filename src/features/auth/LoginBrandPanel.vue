<script setup lang="ts">
import BitMascot from '@/components/BitMascot.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { formatNumber } from '@/lib/format';
import { PLACEMENT_LOOKS } from '@/mascot/bit-sprite';
import { useLocaleStore } from '@/stores/locale.store';
import { useSiteCountsQuery } from './auth.queries';
import AuthBrand from './AuthBrand.vue';

/**
 * LoginB's panel (and LoginPhone's band below lg). Decoration next to a working form: no `QueryState`, no registered
 * wait; a block holds the counts line while it loads, a failure leaves the line empty.
 */
const locale = useLocaleStore();
const { data: counts, isPending } = useSiteCountsQuery();
const show = (value: number) => formatNumber(value, locale.locale);
</script>

<template>
  <aside
    class="grid grid-cols-[auto_1fr] items-center gap-x-3.5 bg-accent-soft px-6 py-5 lg:flex lg:flex-col lg:items-start lg:justify-between lg:p-12"
  >
    <BitMascot :look="PLACEMENT_LOOKS.hero" blinks class="row-span-2 [--bit-px:5px] lg:hidden" />
    <AuthBrand size="lg" />
    <div class="hidden lg:flex lg:flex-col lg:gap-7">
      <BitMascot :look="PLACEMENT_LOOKS.hero" blinks class="[--bit-px:14px]" />
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
      class="min-h-5 font-mono text-xs text-muted tabular-nums lg:text-sm"
    >
      <SkeletonBlock v-if="isPending" text class="w-40" />
      <template v-else-if="counts">{{
        $t('auth.brand.counts', { problems: show(counts.problems), users: show(counts.users) })
      }}</template>
    </p>
  </aside>
</template>
