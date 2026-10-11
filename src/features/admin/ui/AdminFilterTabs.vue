<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue';
import type { RouteLocationRaw } from 'vue-router';

export interface AdminFilterTab {
  key: string;
  label: string;
  to: RouteLocationRaw;
  /** A count chip after the label; hidden at 0. */
  count?: number;
  countLabel?: string;
  countTestid?: string;
  testid?: string;
}

/** The one style for a list's view or filter switch: one row of pills that scrolls sideways on a phone instead of wrapping. */
const props = defineProps<{ tabs: AdminFilterTab[]; current: string; label: string }>();
const nav = ref<HTMLElement | null>(null);

/** On a phone the row scrolls: the current tab is centred in it, never left off-screen. */
function revealCurrent() {
  const box = nav.value;
  const tab = box?.querySelector<HTMLElement>('[aria-current="page"]');
  if (!box || !tab) return;
  box.scrollLeft = tab.offsetLeft - (box.clientWidth - tab.offsetWidth) / 2;
}
onMounted(revealCurrent);
watch(
  () => props.current,
  () => void nextTick(revealCurrent),
);
</script>

<template>
  <nav
    ref="nav"
    :aria-label="label"
    class="flex max-w-full gap-1 self-start overflow-x-auto rounded-pill border border-line-strong bg-surface-solid p-1"
  >
    <RouterLink
      v-for="tab in tabs"
      :key="tab.key"
      :to="tab.to"
      :data-testid="tab.testid"
      :aria-current="tab.key === current ? 'page' : undefined"
      class="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-pill px-4 text-sm font-semibold whitespace-nowrap text-muted hover:text-content aria-[current=page]:bg-accent-soft aria-[current=page]:text-accent-soft-text"
    >
      {{ tab.label }}
      <span
        v-if="tab.count"
        :data-testid="tab.countTestid"
        :aria-label="tab.countLabel"
        class="rounded-pill bg-surface-hover px-2 text-xs"
        >{{ tab.count }}</span
      >
    </RouterLink>
  </nav>
</template>
