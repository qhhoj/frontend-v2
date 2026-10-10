<script setup lang="ts">
import { Search } from 'lucide-vue-next';
import { computed } from 'vue';
import { isProblemSort } from '@/api/types/problems';
import type { CatalogItem } from '@/api/types/problems';
import { translate } from '@/i18n';
import { useDebouncedText } from '@/lib/use-debounced-text';
import FilterToggle from './FilterToggle.vue';
import ProblemPointsPicker from './ProblemPointsPicker.vue';
import ProblemTypePicker from './ProblemTypePicker.vue';
import RandomProblemButton from './RandomProblemButton.vue';
import ToolbarSelect from './ToolbarSelect.vue';
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
const setSort = (value: string) =>
  emit('update', { sort: value !== DEFAULT_SORT && isProblemSort(value) ? value : null });
</script>

<template>
  <div class="flex flex-wrap items-center gap-2" role="search">
    <label class="relative flex min-w-[260px] max-w-[380px] flex-1 items-center text-muted">
      <span class="sr-only">{{ $t('problems.searchLabel') }}</span>
      <Search class="absolute left-3 size-4" aria-hidden="true" />
      <input
        v-model="searchText"
        type="search"
        :placeholder="$t('problems.search')"
        class="h-10 w-full rounded-row border border-line-strong bg-surface pr-3 pl-9 text-sm text-content"
      />
    </label>
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
    <span class="grow" />
    <ToolbarSelect
      :label="$t('problems.sort')"
      :model-value="filters.sort ?? DEFAULT_SORT"
      :options="sortOptions()"
      :active="filters.sort !== null"
      @update:model-value="setSort"
    />
    <RandomProblemButton :filters="filters" />
  </div>
</template>
