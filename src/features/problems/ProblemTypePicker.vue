<script setup lang="ts">
import { problemTypeLabel } from './problem-type-label';
import { ChevronDown } from 'lucide-vue-next';
import { computed, ref } from 'vue';
import type { CatalogItem } from '@/api/types/problems';
import { toolbarControlClass } from '@/components/toolbar-classes';
import Checkbox from '@/components/ui/Checkbox.vue';
import Popover from '@/components/ui/Popover.vue';
import SearchInput from '@/components/ui/SearchInput.vue';

const props = defineProps<{ types: CatalogItem[]; selected: string[] }>();
const emit = defineEmits<{ change: [typeIds: string[]] }>();

const popover = ref<InstanceType<typeof Popover>>();
const open = ref(false);
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
  <button
    type="button"
    aria-haspopup="dialog"
    :aria-expanded="open"
    :class="toolbarControlClass(selected.length > 0)"
    @click="popover?.toggle($event)"
  >
    {{
      selected.length
        ? $t('problems.typesCount', { count: selected.length })
        : $t('problems.typesLabel')
    }}
    <ChevronDown class="size-4" aria-hidden="true" />
  </button>
  <Popover ref="popover" :label="$t('problems.types')" @show="open = true" @hide="open = false">
    <div class="flex w-64 flex-col gap-2">
      <SearchInput
        v-model="query"
        name="typeSearch"
        :label="$t('problems.typeSearch')"
        :placeholder="$t('problems.typeSearch')"
      />
      <ul class="max-h-64 overflow-y-auto">
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
    </div>
  </Popover>
</template>
