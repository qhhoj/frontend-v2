<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router';
import SeeAllLink from './SeeAllLink.vue';

/**
 * A titled block of a page (layout plan §2): the title, an optional count after it and an optional "see all" link at
 * the right, then the content 8 px below (`--space-section-title`). No card around it: sections are separated by space
 * (`PageLayout` puts 40 px between them). Blocks inside one section sit `--space-stack` apart; use `gap-(--space-stack)`.
 */
defineProps<{
  title: string;
  count?: number | string;
  seeAll?: { to: RouteLocationRaw; label: string };
}>();
</script>

<template>
  <section>
    <div class="mb-(--space-section-title) flex items-center gap-2">
      <h2 class="min-w-0 section-title">{{ title }}</h2>
      <span v-if="count !== undefined" class="text-sm text-muted">{{ count }}</span>
      <SeeAllLink v-if="seeAll" :to="seeAll.to" class="ml-auto"
        >{{ seeAll.label }}<span class="sr-only"> {{ title }}</span></SeeAllLink
      >
    </div>
    <slot />
  </section>
</template>
