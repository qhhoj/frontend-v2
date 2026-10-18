<script setup lang="ts">
import { computed } from 'vue';
import type { CatalogItem } from '@/api/types/problems';
import ToolbarSelect from '@/components/ToolbarSelect.vue';
import { translate } from '@/i18n';
import FilterToggle from './FilterToggle.vue';
import ProblemPointsPicker from './ProblemPointsPicker.vue';
import ProblemTypePicker from './ProblemTypePicker.vue';
import type { ProblemFilters } from './use-problem-filters';

/** The problem list's filters besides search and sort: inline on a wide screen, behind "Bộ lọc" on a phone (P-04). */
const props = defineProps<{
  filters: ProblemFilters;
  types: CatalogItem[];
  groups: CatalogItem[];
  /** "Ẩn bài đã giải" means nothing without a signed-in viewer. */
  signedIn: boolean;
}>();
const emit = defineEmits<{ update: [patch: Partial<ProblemFilters>] }>();

const groupOptions = computed(() => [
  { value: '', label: translate('problems.groupAll') },
  ...props.groups.map((group) => ({ value: group.id, label: group.fullName })),
]);
</script>

<template>
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
</template>
