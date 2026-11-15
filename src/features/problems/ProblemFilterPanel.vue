<script setup lang="ts">
import { computed } from 'vue';
import type { CatalogItem } from '@/api/types/problems';
import ToolbarSelect from '@/components/ToolbarSelect.vue';
import Switch from '@/components/ui/Switch.vue';
import { translate } from '@/i18n';
import ProblemPointsRange from './ProblemPointsRange.vue';
import ProblemSortSelect from './ProblemSortSelect.vue';
import ProblemTypeList from './ProblemTypeList.vue';
import type { ProblemFilters } from './use-problem-filters';

/**
 * What "Bộ lọc" opens: the rarer filters (group, types, points, editorial), each applied as it is set. On a phone, whose
 * rows have no column headers, the sort is here too.
 */
const props = defineProps<{
  filters: ProblemFilters;
  types: CatalogItem[];
  groups: CatalogItem[];
  withSort: boolean;
}>();
const emit = defineEmits<{ update: [patch: Partial<ProblemFilters>] }>();

const groupOptions = computed(() => [
  { value: '', label: translate('problems.groupAll') },
  ...props.groups.map((group) => ({ value: group.id, label: group.fullName })),
]);
</script>

<template>
  <!-- Its own scroll below the toolbar: a short window never pushes the panel over the trigger. -->
  <div class="flex max-h-[calc(100dvh-9rem)] w-80 max-w-full flex-col gap-4 overflow-y-auto">
    <ProblemSortSelect
      v-if="withSort"
      :sort="filters.sort"
      @update="emit('update', { sort: $event })"
    />
    <ToolbarSelect
      v-if="groups.length"
      :label="$t('problems.group')"
      :model-value="filters.groupId ?? ''"
      :options="groupOptions"
      :active="filters.groupId !== null"
      @update:model-value="emit('update', { groupId: $event || null })"
    />
    <ProblemTypeList
      v-if="types.length"
      :types="types"
      :selected="filters.typeIds"
      @change="emit('update', { typeIds: $event })"
    />
    <ProblemPointsRange
      :min="filters.pointsMin"
      :max="filters.pointsMax"
      @change="emit('update', $event)"
    />
    <Switch
      :model-value="filters.hasEditorial"
      :label="$t('problems.hasEditorial')"
      :description="$t('problems.hasEditorialHint')"
      @update:model-value="emit('update', { hasEditorial: $event })"
    />
  </div>
</template>
