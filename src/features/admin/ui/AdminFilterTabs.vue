<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue';
import type { RouteLocationRaw } from 'vue-router';

export interface AdminFilterTab {
  key: string;
  label: string;
  /** A link tab (the view lives in the URL). Without `to` the tab is a button that sets `current` (emits `update:current`). */
  to?: RouteLocationRaw;
  /** A count chip after the label; hidden at 0. */
  count?: number;
  countLabel?: string;
  countTestid?: string;
  /** A red dot after the label, read as this text: the view holds something to fix (a field error). */
  alertLabel?: string;
  testid?: string;
}

/**
 * The segmented control of a list's view or filter: pills inside one pill frame, at the admin chip density. Links
 * (`aria-current="page"`) or toggle buttons (`aria-pressed`, replacing `ADMIN_TOGGLE_CLASS` rows). On a narrow phone the
 * pills wrap instead of being clipped; the current one is scrolled into view when the row still overflows.
 */
const props = defineProps<{ tabs: AdminFilterTab[]; current: string; label: string }>();
const emit = defineEmits<{ 'update:current': [key: string] }>();
const nav = ref<HTMLElement | null>(null);

function revealCurrent() {
  const box = nav.value;
  const tab = box?.querySelector<HTMLElement>('[aria-current="page"], [aria-pressed="true"]');
  if (!box || !tab || box.scrollWidth <= box.clientWidth) return;
  box.scrollLeft = tab.offsetLeft - (box.clientWidth - tab.offsetWidth) / 2;
}
onMounted(revealCurrent);
watch(
  () => props.current,
  () => void nextTick(revealCurrent),
);

const PILL =
  'inline-flex min-h-7 shrink-0 items-center gap-1.5 rounded-pill px-3 text-sm font-semibold whitespace-nowrap text-muted hover:text-content pointer-coarse:min-h-9 aria-[current=page]:bg-accent-soft aria-[current=page]:text-accent-soft-text aria-pressed:bg-accent-soft aria-pressed:text-accent-soft-text';
const COUNT = 'rounded-pill bg-surface-strong px-1.5 font-mono text-xs tabular-nums';
const ALERT = 'size-2 shrink-0 rounded-full bg-negative';
</script>

<template>
  <nav
    ref="nav"
    :aria-label="label"
    class="flex max-w-full flex-wrap gap-0.5 self-start overflow-x-auto rounded-[1.125rem] border border-line-strong bg-surface-solid p-0.5"
  >
    <template v-for="tab in tabs" :key="tab.key">
      <RouterLink
        v-if="tab.to"
        :to="tab.to"
        :data-testid="tab.testid"
        :aria-current="tab.key === current ? 'page' : undefined"
        :class="PILL"
      >
        {{ tab.label }}
        <span
          v-if="tab.count"
          :data-testid="tab.countTestid"
          :aria-label="tab.countLabel"
          :class="COUNT"
          >{{ tab.count }}</span
        >
        <span v-if="tab.alertLabel" :data-testid="`${tab.testid}-alert`" :class="ALERT">
          <span class="sr-only">{{ tab.alertLabel }}</span>
        </span>
      </RouterLink>
      <button
        v-else
        type="button"
        :data-testid="tab.testid"
        :aria-pressed="tab.key === current"
        :class="PILL"
        @click="emit('update:current', tab.key)"
      >
        {{ tab.label }}
        <span
          v-if="tab.count"
          :data-testid="tab.countTestid"
          :aria-label="tab.countLabel"
          :class="COUNT"
          >{{ tab.count }}</span
        >
        <span v-if="tab.alertLabel" :data-testid="`${tab.testid}-alert`" :class="ALERT">
          <span class="sr-only">{{ tab.alertLabel }}</span>
        </span>
      </button>
    </template>
  </nav>
</template>
