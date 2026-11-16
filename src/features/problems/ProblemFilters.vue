<script setup lang="ts">
import { SlidersHorizontal } from 'lucide-vue-next';
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import type { CatalogItem } from '@/api/types/problems';
import AppButton from '@/components/ui/AppButton.vue';
import Popover from '@/components/ui/Popover.vue';
import { isComposing } from '@/components/ui/keys';
import Toolbar from '@/components/ui/Toolbar.vue';
import SearchInput from '@/components/ui/SearchInput.vue';
import FilterToggle from './FilterToggle.vue';
import ToolbarSelect from '@/components/ToolbarSelect.vue';
import { translate } from '@/i18n';
import { COMPACT_LIST_QUERY, useMediaQuery } from '@/lib/use-media-query';
import { useDebouncedText } from '@/lib/use-debounced-text';
import ProblemFilterPanel from './ProblemFilterPanel.vue';
import ProblemListCount from './ProblemListCount.vue';
import ProblemSortSelect from './ProblemSortSelect.vue';
import RandomProblemButton from './RandomProblemButton.vue';
import { listedCode, problemSearchIntent } from './problem-search-input';
import { panelFilterCount } from './use-problem-filters';
import type { ProblemFilters, SolvedFilter } from './use-problem-filters';

/**
 * The list's `Toolbar`. A computer: search (Enter opens a typed code), the solved choice as a select ("Trạng thái: Chưa giải",
 * signed in), "Bộ lọc" with the rarer filters; at the right the result count and the random pick (it sorts by the column
 * headers). A phone: one row of the search, a filter icon button (with the count of active filters) and a sort icon button
 * (its rows have no column headers); under it the count small and the solved choice as two one-tap chips. The random pick
 * moves into the filter sheet. The default slot is the active-filter chips.
 */
const props = withDefaults(
  defineProps<{
    filters: ProblemFilters;
    types: CatalogItem[];
    groups: CatalogItem[];
    /** The solved choice means nothing without a signed-in viewer. */
    signedIn: boolean;
    /** Codes of the problems the list shows now: Enter opens the one that equals the typed code. */
    listedCodes?: readonly string[];
    /** The result count shown at the right. */
    countText: string;
  }>(),
  { listedCodes: () => [] },
);
const emit = defineEmits<{ update: [patch: Partial<ProblemFilters>] }>();

const searchText = useDebouncedText(
  () => props.filters.search,
  (search) => emit('update', { search }),
);
const router = useRouter();
/** A code Enter asked for before the list had it: opened when the list for that search arrives. */
let awaitedCode: string | null = null;
const openProblem = (code: string) => {
  awaitedCode = null;
  void router.push({ name: 'problem', params: { code } });
};
const openAwaited = () => {
  const code = awaitedCode === null ? null : listedCode(props.listedCodes, awaitedCode);
  if (code !== null && props.filters.search === awaitedCode) openProblem(code);
};
/** The list for the awaited search arrived without that code: the wish ends, so a later list never opens it. */
const settleAwaited = () => {
  openAwaited();
  if (props.filters.search === awaitedCode) awaitedCode = null;
};
watch(() => props.listedCodes, settleAwaited);
/** Any other change of the query drops the wish too. */
watch(
  () => props.filters.search,
  (search) => {
    if (search !== awaitedCode) awaitedCode = null;
  },
);
/** Enter opens a pasted problem link, or the problem whose code was typed in full; any other text stays a search. */
function openExact(event: KeyboardEvent) {
  // An Enter that confirms an IME candidate (Vietnamese Telex, VNI) is not a submit.
  if (isComposing(event)) return;
  event.preventDefault();
  const { code, isLink } = problemSearchIntent(searchText.value);
  if (code === '') return;
  const listed = listedCode(props.listedCodes, code);
  if (isLink || listed !== null) return openProblem(listed ?? code);
  if (props.filters.search === code) return;
  searchText.commitNow(code);
  awaitedCode = code;
}
/** A phone's rows have no column headers: it gets the sort select. */
const isCompact = useMediaQuery(COMPACT_LIST_QUERY);
const panel = ref<InstanceType<typeof Popover>>();
const isPanelOpen = ref(false);
const panelCount = computed(() => panelFilterCount(props.filters));
const SOLVED_CHOICES = computed(() =>
  (['any', 'unsolved', 'solved'] as const).map((value) => ({
    value,
    label: translate(`problems.solvedFilter.${value}`),
  })),
);
/** The phone's one-tap chips: each toggles its own choice against "all". */
const SOLVED_CHIPS = computed(() => SOLVED_CHOICES.value.filter(({ value }) => value !== 'any'));
const setSolved = (solved: SolvedFilter) => emit('update', { solved });
</script>

<template>
  <Toolbar role="search">
    <template #left>
      <SearchInput
        v-model="searchText"
        :label="$t('problems.searchLabel')"
        :placeholder="$t('problems.search')"
        :class="isCompact ? 'min-w-0 flex-1 basis-0' : 'max-w-80 min-w-44 flex-1'"
        @keydown.enter="openExact"
      />
      <!-- On a phone the choice moves under the row, beside the count, as one-tap chips. -->
      <ToolbarSelect
        v-if="signedIn && !isCompact"
        :label="$t('problems.solvedFilter.prefix')"
        :options="SOLVED_CHOICES"
        :model-value="filters.solved"
        :active="filters.solved !== 'any'"
        @update:model-value="setSolved"
      />
      <!-- A phone: an icon button, the active-filter count beside the icon; its name is the label and the tooltip. -->
      <AppButton
        data-testid="problem-filter-panel-toggle"
        :icon-only="isCompact && !panelCount"
        :aria-label="isCompact ? $t('problems.filterPanel') : undefined"
        :title="isCompact ? $t('problems.filterPanel') : undefined"
        aria-haspopup="dialog"
        :aria-expanded="isPanelOpen"
        @click="panel?.toggle($event)"
      >
        <template #icon><SlidersHorizontal class="size-4" aria-hidden="true" /></template>
        <template v-if="!isCompact">{{ $t('problems.filterPanel') }}</template>
        <span v-if="panelCount" class="font-mono text-caption tabular-nums">{{ panelCount }}</span>
      </AppButton>
      <Popover
        ref="panel"
        :label="$t('problems.filterPanel')"
        @show="isPanelOpen = true"
        @hide="isPanelOpen = false"
      >
        <ProblemFilterPanel
          :filters="filters"
          :types="types"
          :groups="groups"
          :with-random="isCompact"
          @update="emit('update', $event)"
        />
      </Popover>
      <ProblemSortSelect
        v-if="isCompact"
        icon-only
        :sort="filters.sort"
        @update="emit('update', { sort: $event })"
      />
    </template>
    <template v-if="!isCompact" #right>
      <ProblemListCount :text="countText" />
      <RandomProblemButton :filters="filters" labelled />
    </template>
    <template v-if="isCompact || $slots.default" #chips>
      <div v-if="isCompact" class="flex flex-wrap items-center justify-between gap-3">
        <ProblemListCount :text="countText" class="text-caption" />
        <div v-if="signedIn" class="flex items-center gap-(--qh-gap-control)">
          <FilterToggle
            v-for="choice in SOLVED_CHIPS"
            :key="choice.value"
            :pressed="filters.solved === choice.value"
            @toggle="setSolved(filters.solved === choice.value ? 'any' : choice.value)"
            >{{ choice.label }}</FilterToggle
          >
        </div>
      </div>
      <slot />
    </template>
  </Toolbar>
</template>
