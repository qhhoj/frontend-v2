<script setup lang="ts">
import { SlidersHorizontal } from 'lucide-vue-next';
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import type { CatalogItem } from '@/api/types/problems';
import AppButton from '@/components/ui/AppButton.vue';
import Chip from '@/components/ui/Chip.vue';
import Popover from '@/components/ui/Popover.vue';
import SearchInput from '@/components/ui/SearchInput.vue';
import SegmentedControl from '@/components/ui/SegmentedControl.vue';
import { translate } from '@/i18n';
import { COMPACT_LIST_QUERY, useMediaQuery } from '@/lib/use-media-query';
import { useDebouncedText } from '@/lib/use-debounced-text';
import ProblemFilterPanel from './ProblemFilterPanel.vue';
import ProblemSortSelect from './ProblemSortSelect.vue';
import RandomProblemButton from './RandomProblemButton.vue';
import { listedCode, problemSearchIntent } from './problem-search-input';
import { panelFilterCount } from './use-problem-filters';
import type { ProblemFilters, SolvedFilter } from './use-problem-filters';

/**
 * The list's one toolbar row: search (Enter opens a typed code), the solved choice (signed in), "Bộ lọc" with the rarer
 * filters, the order when no column header shows it, and the random pick. On a phone the search takes its own line.
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
  }>(),
  { listedCodes: () => [] },
);
const emit = defineEmits<{ update: [patch: Partial<ProblemFilters>] }>();

const searchText = useDebouncedText(
  () => props.filters.search,
  (search) => emit('update', { search }),
);
const router = useRouter();
const IME_KEY_CODE = 229;
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
  if (event.isComposing || event.keyCode === IME_KEY_CODE) return;
  event.preventDefault();
  const { code, isLink } = problemSearchIntent(searchText.value);
  if (code === '') return;
  const listed = listedCode(props.listedCodes, code);
  if (isLink || listed !== null) return openProblem(listed ?? code);
  if (props.filters.search === code) return;
  searchText.commitNow(code);
  awaitedCode = code;
}
/** Orders the column headers show: every one but the dates. */
const HEADER_SORT_FIELDS: readonly string[] = ['code', 'name', 'points', 'acRate', 'userCount'];
const isHeaderSort = computed(
  () =>
    props.filters.sort !== null &&
    HEADER_SORT_FIELDS.includes(props.filters.sort.replace(/^-/, '')),
);

/** A phone's rows have no column headers: its sort, and the random pick, wait behind "Bộ lọc" with the other filters. */
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
const setSolved = (solved: SolvedFilter) => emit('update', { solved });
</script>

<template>
  <div class="flex flex-wrap items-center gap-2" role="search">
    <SearchInput
      v-model="searchText"
      :label="$t('problems.searchLabel')"
      :placeholder="$t('problems.search')"
      :class="isCompact ? 'basis-full' : 'max-w-80 min-w-44 flex-1'"
      @keydown.enter="openExact"
    />
    <!-- The page-level (md) segments share their frame equally, so the frame gets the width of three labels on a
         computer (the search yields first) and the room beside "Lọc" on a phone. -->
    <SegmentedControl
      v-if="signedIn"
      :class="isCompact ? 'min-w-0 flex-1' : 'min-w-72 shrink-0'"
      :label="$t('problems.solvedFilter.label')"
      :options="SOLVED_CHOICES"
      :model-value="filters.solved"
      @update:model-value="setSolved"
    />
    <AppButton
      data-testid="problem-filter-panel-toggle"
      aria-haspopup="dialog"
      :aria-expanded="isPanelOpen"
      @click="panel?.toggle($event)"
    >
      <template #icon><SlidersHorizontal class="size-4" aria-hidden="true" /></template>
      {{ isCompact ? $t('problems.filterPanelShort') : $t('problems.filterPanel') }}
      <Chip v-if="panelCount" size="sm" class="font-mono tabular-nums">{{ panelCount }}</Chip>
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
        :with-sort="isCompact"
        @update="emit('update', $event)"
      />
      <RandomProblemButton v-if="isCompact" :filters="filters" labelled class="mt-3" />
    </Popover>
    <!-- The default order (newest first) and the other date orders have no column: the select says which one is on. -->
    <ProblemSortSelect
      v-if="!isCompact && !isHeaderSort"
      :sort="filters.sort"
      @update="emit('update', { sort: $event })"
    />
    <RandomProblemButton v-if="!isCompact" :filters="filters" class="ml-auto" />
  </div>
</template>
