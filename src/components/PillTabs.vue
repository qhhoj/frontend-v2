<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router';

export interface PillTab {
  key: string;
  label: string;
  to: RouteLocationRaw;
  /** Lights the tab on a page that is not its own route; otherwise the router marks the exact match. */
  isCurrent?: boolean;
  badge?: {
    text: string;
    /** `neutral` is a count; `accent` says something waits for the viewer. */
    tone: 'neutral' | 'accent';
    /** Spoken instead of the bare number. */
    srLabel?: string;
  };
}

defineProps<{ tabs: PillTab[]; label: string }>();

/** The open tab is the one RouterLink marks `aria-current="page"` (exact match), so no route comparison is needed. */
const LINK =
  'inline-flex min-h-11 items-center gap-2 rounded-pill border border-transparent px-4 text-sm font-medium whitespace-nowrap text-muted hover:bg-surface-hover hover:text-content aria-[current=page]:border-accent aria-[current=page]:bg-accent-soft aria-[current=page]:font-semibold aria-[current=page]:text-accent-soft-text';
const BADGE =
  'inline-flex min-w-5 items-center justify-center rounded-pill px-1.5 text-tiny font-semibold tabular-nums';
const BADGE_TONE = {
  neutral: 'bg-surface-hover text-content',
  accent: 'bg-accent text-on-accent',
};
</script>

<template>
  <!-- The padding and negative margin leave room for the focus ring that the scroll frame would clip. -->
  <nav :aria-label="label" class="-m-1 flex gap-1 overflow-x-auto p-1">
    <RouterLink
      v-for="tab in tabs"
      :key="tab.key"
      :to="tab.to"
      v-bind="tab.isCurrent ? { 'aria-current': 'page' } : {}"
      :class="LINK"
    >
      {{ tab.label }}
      <span v-if="tab.badge" :class="[BADGE, BADGE_TONE[tab.badge.tone]]" data-testid="tab-badge">
        <span :aria-hidden="tab.badge.srLabel ? 'true' : undefined">{{ tab.badge.text }}</span>
        <span v-if="tab.badge.srLabel" class="sr-only">{{ tab.badge.srLabel }}</span>
      </span>
    </RouterLink>
  </nav>
</template>
