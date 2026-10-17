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
const setSort = (value: string) =>
  emit('update', { sort: value !== DEFAULT_SORT && isProblemSort(value) ? value : null });

/** P-04: a phone keeps search and sort in sight; the other filters and the random pick wait behind "Bộ lọc". */
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
    <!-- Sort and the random pick wrap together, so a narrow row never leaves one of them alone. -->
    <div class="flex max-w-full min-w-0 flex-wrap items-center gap-2">
      <ToolbarSelect
        :label="$t('problems.sort')"
        :model-value="filters.sort ?? DEFAULT_SORT"
        :options="sortOptions()"
        :active="filters.sort !== null"
        @update:model-value="setSort"
      />
      <RandomProblemButton v-if="!isCompact" :filters="filters" />
    </div>
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
        <span v-if="panelCount" class="font-mono text-xs tabular-nums">{{ panelCount }}</span>
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
