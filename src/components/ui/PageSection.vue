<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router';
import SeeAllLink from './SeeAllLink.vue';

/**
 * The one section header ("Sơn mài" placement): the title at the left with an optional count after it (mono, 13 px); at the right a
 * note, a "see all" link (`seeAll`) or one small quiet button (`#actions`). The content sits 8 px below (`--space-section-title`). No card around it: sections are separated by space
 * (`PageLayout` puts 40 px between them). The `lead` slot sits before the title (a StatusDot). Blocks inside one section sit `--space-stack` apart; use `gap-(--space-stack)`.
 */
defineProps<{
  title: string;
  count?: number | string;
  seeAll?: { to: RouteLocationRaw; label: string };
}>();
</script>

<template>
  <section>
    <div class="mb-(--space-section-title) flex min-h-(--qh-control-sm) items-center gap-2">
      <slot name="lead" />
      <h2 class="min-w-0 section-title">{{ title }}</h2>
      <span v-if="count !== undefined" class="font-mono text-small text-muted">{{ count }}</span>
      <div
        v-if="seeAll || $slots.actions"
        class="ml-auto flex items-center gap-3 text-meta text-muted"
      >
        <slot name="actions" />
        <SeeAllLink v-if="seeAll" :to="seeAll.to"
          >{{ seeAll.label }}<span class="sr-only"> {{ title }}</span></SeeAllLink
        >
      </div>
    </div>
    <slot />
  </section>
</template>
