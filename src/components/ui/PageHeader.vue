<script setup lang="ts">
import { ChevronLeft } from 'lucide-vue-next';
import { useSlots } from 'vue';
import type { RouteLocationRaw } from 'vue-router';

export interface PageCrumb {
  label: string;
  to?: RouteLocationRaw;
  /** A code or a slug, set in mono. */
  mono?: boolean;
}

/**
 * A page's header and the only place an H1 is written: breadcrumb (from `md`), the one H1 at the page step (`page-title`,
 * 26 px, for every page, admin included), a 13 px meta line, an optional one-line lead, the actions on the right (below
 * the title on a phone) and the page's tabs under it all. Below `md` the breadcrumb becomes the `back` link.
 * `meta` strings are joined by "·"; the `#meta` slot adds chips or a status to the same line. `#start` is a Bit, logo
 * or avatar left of the text, `#above` a kicker line over the title (a code, chips, a summary) and `#lead` a lead that
 * holds more than a string.
 */
withDefaults(
  defineProps<{
    title: string;
    lead?: string;
    crumbs?: PageCrumb[];
    back?: { to: RouteLocationRaw; label: string; ariaLabel?: string } | null;
    meta?: string[];
  }>(),
  { lead: undefined, crumbs: () => [], back: null, meta: () => [] },
);
defineSlots<{
  start?: () => unknown;
  above?: () => unknown;
  meta?: () => unknown;
  lead?: () => unknown;
  actions?: () => unknown;
  tabs?: () => unknown;
}>();
const slots = useSlots();
</script>

<template>
  <header class="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-end md:gap-4">
    <div class="flex min-w-0 items-center gap-3 md:min-w-[min(100%,16rem)] md:flex-1">
      <div v-if="slots.start" class="shrink-0"><slot name="start" /></div>
      <div class="min-w-0 flex-1">
        <nav
          v-if="crumbs.length > 0"
          :aria-label="$t('common.breadcrumb')"
          class="hidden flex-wrap items-center gap-1.5 text-meta text-muted md:flex"
        >
          <template v-for="(crumb, index) in crumbs" :key="index">
            <span v-if="index > 0" aria-hidden="true">/</span>
            <RouterLink
              v-if="crumb.to"
              :to="crumb.to"
              class="hover:text-content hover:underline"
              :class="{ 'font-mono': crumb.mono }"
              >{{ crumb.label }}</RouterLink
            >
            <span v-else :class="{ 'font-mono': crumb.mono }">{{ crumb.label }}</span>
          </template>
        </nav>
        <RouterLink
          v-if="back"
          :to="back.to"
          :aria-label="back.ariaLabel"
          class="-ml-1 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-accent-text md:hidden"
        >
          <ChevronLeft aria-hidden="true" class="size-4" />{{ back.label }}
        </RouterLink>
        <div v-if="slots.above" class="mb-1"><slot name="above" /></div>
        <h1 class="page-title [overflow-wrap:anywhere]">{{ title }}</h1>
        <div
          v-if="meta.length > 0 || slots.meta"
          class="mt-1 flex flex-wrap items-center gap-2 text-meta text-muted"
        >
          <template v-for="(item, index) in meta" :key="index">
            <span v-if="index > 0" aria-hidden="true">·</span>
            <span>{{ item }}</span>
          </template>
          <slot name="meta" />
        </div>
        <div v-if="slots.lead" class="mt-0.5 text-sm text-muted"><slot name="lead" /></div>
        <p v-else-if="lead" class="mt-0.5 text-sm text-muted">{{ lead }}</p>
      </div>
    </div>
    <div
      v-if="slots.actions"
      data-testid="page-header-actions"
      class="flex flex-wrap items-center gap-2"
    >
      <slot name="actions" />
    </div>
    <div v-if="slots.tabs" class="min-w-0 md:basis-full">
      <slot name="tabs" />
    </div>
  </header>
</template>
