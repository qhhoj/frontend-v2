<script setup lang="ts">
import { computed } from 'vue';
import type { CatalogItem } from '@/api/types/problems';
import SelectField from '@/components/ui/SelectField.vue';
import Switch from '@/components/ui/Switch.vue';
import { translate } from '@/i18n';
import ProblemPointsRange from './ProblemPointsRange.vue';
import RandomProblemButton from './RandomProblemButton.vue';
import ProblemTypeList from './ProblemTypeList.vue';
import type { ProblemFilters } from './use-problem-filters';

/**
 * What "Bộ lọc" opens: the rarer filters (group, types, points, editorial), each applied as it is set. The list scrolls inside
 * the popover; its padding is given back with a negative margin (`-m-3 p-3`), so a focus ring, a slider thumb and a switch's
 * 44 px hit area at the edge are not clipped and never make it scroll sideways.
 */
const props = defineProps<{
  filters: ProblemFilters;
  types: CatalogItem[];
  groups: CatalogItem[];
  /** A phone's toolbar has no room for the random pick: it is the last line of the sheet. */
  withRandom?: boolean;
}>();
const emit = defineEmits<{ update: [patch: Partial<ProblemFilters>] }>();

const groupOptions = computed(() => [
  { value: '', label: translate('problems.groupAll') },
  ...props.groups.map((group) => ({ value: group.id, label: group.fullName })),
]);
</script>

<template>
  <!-- Its own scroll below the toolbar: a short window never pushes the panel over the trigger. -->
  <div
    class="-m-3 flex max-h-[calc(100dvh-9rem)] w-86 max-w-full flex-col gap-4 overflow-y-auto p-3"
  >
    <SelectField
      v-if="groups.length"
      :prefix="$t('problems.group')"
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
    <RandomProblemButton v-if="withRandom" :filters="filters" labelled />
  </div>
</template>
