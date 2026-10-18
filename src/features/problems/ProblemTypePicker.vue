<script setup lang="ts">
import { problemTypeLabel } from './problem-type-label';
import { ChevronDown } from 'lucide-vue-next';
import { computed, ref } from 'vue';
import type { CatalogItem } from '@/api/types/problems';
import { toolbarControlClass } from '@/components/toolbar-classes';
import Popover from '@/components/ui/Popover.vue';

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
      <input
        v-model="query"
        type="search"
        name="typeSearch"
        :aria-label="$t('problems.typeSearch')"
        :placeholder="$t('problems.typeSearch')"
        class="h-10 rounded-row border border-line bg-surface-strong px-3 text-content"
      />
      <ul class="max-h-64 overflow-y-auto">
        <li v-for="type in shown" :key="type.id">
          <label class="flex min-h-10 cursor-pointer items-center gap-2.5 px-1 text-sm">
            <input
              type="checkbox"
              class="size-4 accent-[var(--qh-accent)]"
              :checked="selected.includes(type.id)"
              @change="toggle(type.id)"
            />
            {{ problemTypeLabel(type) }}
          </label>
        </li>
        <li v-if="!shown.length" class="px-1 py-2 text-sm text-muted">
          {{ $t('problems.noTypes') }}
        </li>
      </ul>
    </div>
  </Popover>
</template>
