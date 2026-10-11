<script setup lang="ts">
import { useId } from 'vue';
import type { RouteLocationRaw } from 'vue-router';
import { CARD } from '@/features/admin/ui/controls';

/**
 * One list section of the Quản lý page, headed like the admin panels beside it (an h3 above a bordered card), with an
 * optional "all …" link to the full list.
 */
defineProps<{ title: string; allLabel?: string; allTo?: RouteLocationRaw }>();
const headingId = useId();
</script>

<template>
  <section :aria-labelledby="headingId" class="flex min-w-0 flex-col gap-3">
    <header class="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
      <h3 :id="headingId" class="font-display text-base font-semibold">{{ title }}</h3>
      <RouterLink
        v-if="allTo && allLabel"
        :to="allTo"
        class="text-sm font-semibold text-accent-text hover:underline"
        >{{ allLabel }} →</RouterLink
      >
    </header>
    <div :class="CARD">
      <slot />
    </div>
  </section>
</template>
