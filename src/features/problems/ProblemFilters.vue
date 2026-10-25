<script setup lang="ts">
import { SlidersHorizontal } from 'lucide-vue-next';
import { computed, ref, useId } from 'vue';
import { isProblemSort } from '@/api/types/problems';
import type { CatalogItem } from '@/api/types/problems';
import { toolbarControlClass } from '@/components/toolbar-classes';
import { COMPACT_LIST_QUERY, useMediaQuery } from '@/lib/use-media-query';
import { useDebouncedText } from '@/lib/use-debounced-text';
import ProblemFilterControls from './ProblemFilterControls.vue';
import RandomProblemButton from './RandomProblemButton.vue';
import ToolbarSearch from '@/components/ToolbarSearch.vue';
import ToolbarSelect from '@/components/ToolbarSelect.vue';
import { DEFAULT_SORT, sortOptions } from './problem-sort-options';
import { panelFilterCount } from './use-problem-filters';
import type { ProblemFilters } from './use-problem-filters';

const props = defineProps<{
  filters: ProblemFilters;
  types: CatalogItem[];
  groups: CatalogItem[];
  /** "Ẩn bài đã giải" means nothing without a signed-in viewer. */
  signedIn: boolean;
}>();
const emit = defineEmits<{ update: [patch: Partial<ProblemFilters>] }>();

const searchText = useDebouncedText(
  () => props.filters.search,
  (search) => emit('update', { search }),
);
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
    <ToolbarSearch
      v-model="searchText"
      :label="$t('problems.searchLabel')"
      :placeholder="$t('problems.search')"
      :class="isCompact ? 'basis-full' : 'max-w-[320px] min-w-[180px] flex-1'"
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
      <button
        type="button"
        data-testid="problem-filter-panel-toggle"
        :aria-expanded="isPanelOpen"
        :aria-controls="panelId"
        :class="[toolbarControlClass(panelCount > 0), 'border-dashed']"
        @click="isPanelOpen = !isPanelOpen"
      >
        <SlidersHorizontal class="size-4" aria-hidden="true" />
        {{ $t('problems.filterPanel') }}
        <span v-if="panelCount" class="font-mono text-caption leading-4 tabular-nums">{{
          panelCount
        }}</span>
      </button>
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
