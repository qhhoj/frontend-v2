<script setup lang="ts">
import { SlidersHorizontal } from 'lucide-vue-next';
import { computed, ref, useId, watch } from 'vue';
import { useRouter } from 'vue-router';
import { isProblemSort } from '@/api/types/problems';
import type { CatalogItem } from '@/api/types/problems';
import AppButton from '@/components/ui/AppButton.vue';
import Chip from '@/components/ui/Chip.vue';
import { COMPACT_LIST_QUERY, useMediaQuery } from '@/lib/use-media-query';
import { useDebouncedText } from '@/lib/use-debounced-text';
import ProblemFilterControls from './ProblemFilterControls.vue';
import RandomProblemButton from './RandomProblemButton.vue';
import SearchInput from '@/components/ui/SearchInput.vue';
import ToolbarSelect from '@/components/ToolbarSelect.vue';
import { DEFAULT_SORT, sortOptions } from './problem-sort-options';
import { listedCode, problemSearchIntent } from './problem-search-input';
import { panelFilterCount } from './use-problem-filters';
import type { ProblemFilters } from './use-problem-filters';

const props = withDefaults(
  defineProps<{
    filters: ProblemFilters;
    types: CatalogItem[];
    groups: CatalogItem[];
    /** "Ẩn bài đã giải" means nothing without a signed-in viewer. */
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
/** Orders the column headers can show: the name and the three number columns. */
const HEADER_SORT_FIELDS: readonly string[] = ['name', 'points', 'acRate', 'userCount'];
const hasNonHeaderSort = computed(
  () =>
    props.filters.sort !== null &&
    !HEADER_SORT_FIELDS.includes(props.filters.sort.replace(/^-/, '')),
);
const setSort = (value: string) =>
  emit('update', { sort: value !== DEFAULT_SORT && isProblemSort(value) ? value : null });

/** A phone keeps search and sort in sight; the other filters and the random pick wait behind "Bộ lọc". */
const isCompact = useMediaQuery(COMPACT_LIST_QUERY);
const isPanelOpen = ref(false);
const panelId = useId();
const panelCount = computed(() => panelFilterCount(props.filters));
</script>

<template>
  <div class="flex flex-wrap items-center gap-2" role="search">
    <SearchInput
      v-model="searchText"
      :label="$t('problems.searchLabel')"
      :placeholder="$t('problems.search')"
      :class="isCompact ? 'basis-full' : 'max-w-[320px] min-w-[180px] flex-1'"
      @keydown.enter="openExact"
    />
    <ProblemFilterControls
      v-if="!isCompact"
      :filters="filters"
      :types="types"
      :groups="groups"
      :signed-in="signedIn"
      @update="emit('update', $event)"
    />
    <!-- Desktop sorts by the column headers. The select stays on phones (compact rows have no headers) and on
         desktop while the list is in an order no header shows (newest is the default; oldest, code). -->
    <ToolbarSelect
      :class="{ 'sm:hidden': !hasNonHeaderSort }"
      :label="$t('problems.sort')"
      :model-value="filters.sort ?? DEFAULT_SORT"
      :options="sortOptions()"
      :active="filters.sort !== null"
      @update:model-value="setSort"
    />
    <RandomProblemButton v-if="!isCompact" :filters="filters" class="ml-auto" />
    <template v-if="isCompact">
      <AppButton
        data-testid="problem-filter-panel-toggle"
        :aria-expanded="isPanelOpen"
        :aria-controls="panelId"
        @click="isPanelOpen = !isPanelOpen"
      >
        <template #icon><SlidersHorizontal class="size-4" aria-hidden="true" /></template>
        {{ $t('problems.filterPanel') }}
        <Chip v-if="panelCount" class="font-mono tabular-nums">{{ panelCount }}</Chip>
      </AppButton>
      <div v-show="isPanelOpen" :id="panelId" class="flex basis-full flex-wrap items-center gap-2">
        <ProblemFilterControls
          :filters="filters"
          :types="types"
          :groups="groups"
          :signed-in="signedIn"
          @update="emit('update', $event)"
        />
        <RandomProblemButton :filters="filters" />
      </div>
    </template>
  </div>
</template>
