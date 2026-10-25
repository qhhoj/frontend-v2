<script setup lang="ts">
import { CornerDownLeft, Search, SlidersHorizontal, X } from 'lucide-vue-next';
import { onBeforeUnmount, ref, useId, watch } from 'vue';
import type { RouteLocationRaw } from 'vue-router';
import { useRouter } from 'vue-router';
import { INPUT, buttonClass } from '@/features/admin/ui/controls';

export interface ActiveFilter {
  key: string;
  label: string;
}

/**
 * One filter row above a list (pages/admin.md, "Filter bar"): a search box applied 250 ms after typing stops, inline
 * selects (`selects` slot), the view switch (`view` slot, an `AdminFilterTabs`), a "Bộ lọc (2)" button that opens the
 * `filters` panel, and the result count at the right; the row wraps on narrow screens. Active filters show as removable
 * chips under the row, with "clear all" (`clear-all`) after them. `exact` is an exact code or username match: a
 * "Mở hcmus41c ↵" row appears under the box and Enter opens it. No apply buttons: the consumer writes every change to the
 * query string.
 */
const props = withDefaults(
  defineProps<{
    searchLabel: string;
    resultText?: string;
    exact?: { label: string; to: RouteLocationRaw } | null;
    chips?: ActiveFilter[];
    filterCount?: number;
  }>(),
  { resultText: undefined, exact: null, chips: () => [], filterCount: 0 },
);
const search = defineModel<string>('search', { default: '' });
const emit = defineEmits<{ remove: [key: string]; 'clear-all': [] }>();
const router = useRouter();
const panelId = useId();
const isPanelOpen = ref(false);

const SEARCH_DELAY_MS = 250;
const typed = ref(search.value);
let timer: ReturnType<typeof setTimeout> | undefined;
watch(typed, (text) => {
  clearTimeout(timer);
  timer = setTimeout(() => {
    timer = undefined;
    if (text !== search.value) search.value = text;
  }, SEARCH_DELAY_MS);
});
watch(search, (text) => {
  if (timer === undefined && text !== typed.value) typed.value = text;
});
onBeforeUnmount(() => clearTimeout(timer));

/** The text an Enter is waiting on: `exact` opens once the search has settled on it. Null: nothing waits. */
let awaitedText: string | null = null;
const settle = () => {
  if (awaitedText === null || search.value.trim() !== awaitedText || !props.exact) return;
  awaitedText = null;
  void router.push(props.exact.to);
};
// Registered in setup, so it stops with the component and an unmounted bar never navigates.
watch([() => props.exact, search], settle);
const cancelAwaited = () => (awaitedText = null);
onBeforeUnmount(cancelAwaited);

/**
 * Enter opens the exact match for the text in the box. While the pause is still pending, `exact` was made from older text:
 * apply the typed text now and open once `exact` follows it. The wait ends at the next key, the next Enter or unmount.
 */
function openExact(event: KeyboardEvent) {
  event.preventDefault();
  cancelAwaited();
  if (timer === undefined || typed.value.trim() === search.value.trim()) {
    if (props.exact) void router.push(props.exact.to);
    return;
  }
  clearTimeout(timer);
  timer = undefined;
  awaitedText = typed.value.trim();
  search.value = typed.value;
}
const removeChip = (key: string) => emit('remove', key);
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="flex flex-wrap items-center gap-2">
      <div class="relative min-w-0 flex-1 basis-56">
        <Search
          aria-hidden="true"
          class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
          :stroke-width="1.75"
        />
        <input
          v-model="typed"
          type="search"
          :aria-label="searchLabel"
          :placeholder="searchLabel"
          :class="[INPUT, 'pl-9']"
          @input="cancelAwaited"
          @keydown.enter="openExact"
        />
        <RouterLink
          v-if="exact"
          :to="exact.to"
          class="absolute inset-x-0 top-full z-20 mt-1 flex min-h-(--qh-control) items-center gap-2 rounded-cell border border-line-strong bg-surface-solid px-3 text-sm font-semibold text-accent-text hover:bg-surface-hover"
        >
          {{ exact.label }}
          <CornerDownLeft
            aria-hidden="true"
            class="ml-auto size-4 text-muted"
            :stroke-width="1.75"
          />
        </RouterLink>
      </div>
      <slot name="selects" />
      <slot name="view" />
      <button
        v-if="$slots.filters"
        type="button"
        :class="buttonClass('secondary')"
        :aria-expanded="isPanelOpen"
        :aria-controls="panelId"
        @click="isPanelOpen = !isPanelOpen"
      >
        <SlidersHorizontal aria-hidden="true" class="size-4" :stroke-width="1.75" />
        {{
          filterCount
            ? $t('common.table.filtersCount', { count: filterCount })
            : $t('common.table.filters')
        }}
      </button>
      <span
        v-if="resultText"
        class="ml-auto text-sm whitespace-nowrap text-muted"
        aria-live="polite"
      >
        {{ resultText }}
      </span>
    </div>
    <div
      v-if="$slots.filters"
      v-show="isPanelOpen"
      :id="panelId"
      class="grid gap-3 rounded-row border border-line bg-surface-solid p-3 sm:grid-cols-2 lg:grid-cols-4"
    >
      <slot name="filters" />
    </div>
    <ul v-if="chips.length" class="m-0 flex list-none flex-wrap items-center gap-2 p-0">
      <li v-for="chip in chips" :key="chip.key">
        <button
          type="button"
          class="inline-flex h-(--qa-chip) items-center gap-1 rounded-pill border border-line-strong bg-surface-solid pr-1.5 pl-2.5 text-caption leading-4 font-semibold hover:bg-surface-hover"
          :aria-label="$t('common.table.removeFilter', { label: chip.label })"
          @click="removeChip(chip.key)"
        >
          {{ chip.label }}
          <X aria-hidden="true" class="size-3.5 text-muted" :stroke-width="1.75" />
        </button>
      </li>
      <li>
        <button type="button" :class="buttonClass('ghost', 'sm')" @click="$emit('clear-all')">
          {{ $t('common.table.clearAll') }}
        </button>
      </li>
    </ul>
  </div>
</template>
