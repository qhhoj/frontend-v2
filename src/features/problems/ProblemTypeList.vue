<script setup lang="ts">
import { computed, ref, useId } from 'vue';
import type { CatalogItem } from '@/api/types/problems';
import Checkbox from '@/components/ui/Checkbox.vue';
import SearchInput from '@/components/ui/SearchInput.vue';
import { problemTypeLabel } from './problem-type-label';

/** The types filter of the "Bộ lọc" panel: a search over the types and a checkbox each. A tick applies at once. */
const props = defineProps<{ types: CatalogItem[]; selected: string[] }>();
const emit = defineEmits<{ change: [typeIds: string[]] }>();

const titleId = useId();
const query = ref('');
const shown = computed(() => {
  const needle = query.value.trim().toLocaleLowerCase();
  return props.types.filter((type) => problemTypeLabel(type).toLocaleLowerCase().includes(needle));
});
const toggle = (id: string) =>
  emit(
    'change',
    props.selected.includes(id)
      ? props.selected.filter((picked) => picked !== id)
      : [...props.selected, id],
  );
</script>

<template>
  <fieldset class="m-0 flex flex-col gap-2 border-0 p-0" :aria-labelledby="titleId">
    <p :id="titleId" class="text-sm font-semibold">
      {{
        selected.length
          ? $t('problems.typesCount', { count: selected.length })
          : $t('problems.typesLabel')
      }}
    </p>
    <SearchInput
      v-model="query"
      name="typeSearch"
      :label="$t('problems.typeSearch')"
      :placeholder="$t('problems.typeSearch')"
    />
    <ul class="max-h-48 overflow-y-auto">
      <li v-for="type in shown" :key="type.id">
        <Checkbox
          :model-value="selected.includes(type.id)"
          :label="problemTypeLabel(type)"
          @update:model-value="toggle(type.id)"
        />
      </li>
      <li v-if="!shown.length" class="px-1 py-2 text-sm text-muted">
        {{ $t('problems.noTypes') }}
      </li>
    </ul>
  </fieldset>
</template>
