<script setup lang="ts">
import { ArrowDownUp } from 'lucide-vue-next';
import { isProblemSort } from '@/api/types/problems';
import type { ProblemSort } from '@/api/types/problems';
import SelectField from '@/components/ui/SelectField.vue';
import IconButton from '@/components/ui/IconButton.vue';
import Menu from '@/components/ui/Menu.vue';
import { DEFAULT_SORT, sortOptions } from './problem-sort-options';

/**
 * "Sắp xếp: Mới nhất ↓": every order the API offers. The default order is written to the URL as no sort. `iconOnly` (a phone's
 * toolbar) draws a square icon button that opens a menu of the same orders.
 */
const props = defineProps<{ sort: ProblemSort | null; iconOnly?: boolean }>();
const emit = defineEmits<{ update: [sort: ProblemSort | null] }>();
const pick = (value: string) =>
  emit('update', value !== DEFAULT_SORT && isProblemSort(value) ? value : null);
</script>

<template>
  <Menu
    v-if="iconOnly"
    :label="$t('problems.sort')"
    :items="sortOptions().map((option) => ({ label: option.label, run: () => pick(option.value) }))"
  >
    <template #trigger="{ toggle, open, setOpener }">
      <IconButton
        :ref="(el) => setOpener((el as { $el?: HTMLElement } | null)?.$el ?? null)"
        :label="$t('problems.sort')"
        :pressed="props.sort !== null"
        aria-haspopup="menu"
        :aria-expanded="open"
        @click="toggle"
      >
        <ArrowDownUp aria-hidden="true" />
      </IconButton>
    </template>
  </Menu>
  <SelectField
    v-else
    :prefix="$t('problems.sort')"
    :model-value="props.sort ?? DEFAULT_SORT"
    :options="sortOptions()"
    :active="props.sort !== null"
    @update:model-value="pick"
  />
</template>
