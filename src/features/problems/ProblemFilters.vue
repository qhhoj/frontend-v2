<script setup lang="ts">
import { computed } from 'vue';
import { isProblemSort } from '@/api/types/problems';
import type { CatalogItem } from '@/api/types/problems';
import { translate } from '@/i18n';
import { useDebouncedText } from '@/lib/use-debounced-text';
import FilterToggle from './FilterToggle.vue';
import ProblemPointsPicker from './ProblemPointsPicker.vue';
import ProblemTypePicker from './ProblemTypePicker.vue';
import RandomProblemButton from './RandomProblemButton.vue';
import ToolbarSearch from '@/components/ToolbarSearch.vue';
import ToolbarSelect from '@/components/ToolbarSelect.vue';
import { DEFAULT_SORT, sortOptions } from './problem-sort-options';
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
const groupOptions = computed(() => [
  { value: '', label: translate('problems.groupAll') },
  ...props.groups.map((group) => ({ value: group.id, label: group.fullName })),
]);
/** Orders the column headers can show: the name and the three number columns. */
const HEADER_SORT_FIELDS: readonly string[] = ['name', 'points', 'acRate', 'userCount'];
const hasNonHeaderSort = computed(
  () =>
    props.filters.sort !== null &&
    !HEADER_SORT_FIELDS.includes(props.filters.sort.replace(/^-/, '')),
);
const setSort = (value: string) =>
  emit('update', { sort: value !== DEFAULT_SORT && isProblemSort(value) ? value : null });
</script>

<template>
  <div class="flex flex-wrap items-center gap-2" role="search">
    <ToolbarSearch
      v-model="searchText"
      :label="$t('problems.searchLabel')"
      :placeholder="$t('problems.search')"
      class="min-w-[180px] max-w-[320px] flex-1"
    />
    <ToolbarSelect
      :label="$t('problems.group')"
      :model-value="filters.groupId ?? ''"
      :options="groupOptions"
      :active="filters.groupId !== null"
      @update:model-value="emit('update', { groupId: $event || null })"
    />
    <ProblemTypePicker
      :types="types"
      :selected="filters.typeIds"
      @change="emit('update', { typeIds: $event })"
    />
    <ProblemPointsPicker
      :min="filters.pointsMin"
      :max="filters.pointsMax"
      @change="emit('update', $event)"
    />
    <FilterToggle
      :pressed="filters.hideSolved"
      :disabled="!signedIn"
      :title="signedIn ? undefined : $t('problems.signInToHide')"
      @toggle="emit('update', { hideSolved: !filters.hideSolved })"
    >
      {{ $t('problems.hideSolved') }}
    </FilterToggle>
    <FilterToggle
      :pressed="filters.hasEditorial"
      @toggle="emit('update', { hasEditorial: !filters.hasEditorial })"
    >
      {{ $t('problems.hasEditorial') }}
    </FilterToggle>
    <!-- Desktop sorts by the column headers. The select stays on phones (the table scrolls sideways there) and on
         desktop while the list is in an order no header shows (newest is the default; oldest, code). -->
    <ToolbarSelect
      :class="{ 'sm:hidden': !hasNonHeaderSort }"
      :label="$t('problems.sort')"
      :model-value="filters.sort ?? DEFAULT_SORT"
      :options="sortOptions()"
      :active="filters.sort !== null"
      @update:model-value="setSort"
    />
    <RandomProblemButton :filters="filters" class="ml-auto" />
  </div>
</template>
