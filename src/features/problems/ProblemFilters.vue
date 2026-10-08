<script setup lang="ts">
import { ChevronDown, Search, X } from 'lucide-vue-next';
import Popover from 'primevue/popover';
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import type { CatalogItem } from '@/api/types/problems';
import TokenCoin from '@/components/TokenCoin.vue';
import { translate } from '@/i18n';
import type { ProblemFilters } from './use-problem-filters';

const SEARCH_DEBOUNCE_MS = 300;
const props = defineProps<{ filters: ProblemFilters; types: CatalogItem[] }>();
const emit = defineEmits<{ update: [patch: Partial<ProblemFilters>] }>();

const searchText = ref(props.filters.search);
let searchTimer: ReturnType<typeof setTimeout> | undefined;
watch(searchText, (value) => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => emit('update', { search: value.trim() }), SEARCH_DEBOUNCE_MS);
});
watch(
  () => props.filters.search,
  (value) => {
    if (value !== searchText.value.trim()) searchText.value = value;
  },
);
onBeforeUnmount(() => clearTimeout(searchTimer));

const isSelected = (id: string) => props.filters.typeIds.includes(id);
const toggleType = (id: string) =>
  emit('update', {
    typeIds: isSelected(id)
      ? props.filters.typeIds.filter((selected) => selected !== id)
      : [...props.filters.typeIds, id],
  });

const pointsPopover = ref<InstanceType<typeof Popover>>();
const pointsOpen = ref(false);
const pointsLabel = computed(() => {
  const { pointsMin, pointsMax } = props.filters;
  return pointsMin === null && pointsMax === null
    ? translate('problems.pointsAny')
    : translate('problems.pointsRange', { min: pointsMin ?? '…', max: pointsMax ?? '…' });
});
function setPoints(key: 'pointsMin' | 'pointsMax', event: Event) {
  const text = (event.target as HTMLInputElement).value;
  emit('update', { [key]: text === '' ? null : Math.trunc(Number(text)) });
}
</script>

<template>
  <div class="flex flex-col items-center gap-4">
    <label
      class="glass flex h-14 w-full max-w-[720px] items-center gap-2.5 rounded-pill px-5 text-muted"
    >
      <span class="sr-only">{{ $t('problems.search') }}</span>
      <Search class="size-5 shrink-0" aria-hidden="true" />
      <input
        v-model="searchText"
        type="search"
        :placeholder="$t('problems.search')"
        class="min-h-11 flex-1 bg-transparent text-base text-content"
      />
    </label>
    <div
      role="group"
      :aria-label="$t('problems.types')"
      class="flex flex-wrap justify-center gap-2"
    >
      <button
        v-for="type in types"
        :key="type.id"
        type="button"
        :aria-pressed="isSelected(type.id)"
        class="flex h-11 items-center gap-2 rounded-pill border pr-3 pl-1.5 text-sm"
        :class="
          isSelected(type.id)
            ? 'border-accent bg-accent-soft font-semibold text-accent-soft-text'
            : 'border-line bg-surface text-content hover:bg-surface-hover'
        "
        @click="toggleType(type.id)"
      >
        <TokenCoin :seed="type.name" size="sm" />
        {{ type.fullName }}
        <X v-if="isSelected(type.id)" class="size-4" aria-hidden="true" />
      </button>
      <span aria-hidden="true" class="mx-1.5 w-px self-stretch bg-line" />
      <button
        type="button"
        aria-haspopup="dialog"
        :aria-expanded="pointsOpen"
        :aria-label="`${$t('problems.pointsFilter')}: ${pointsLabel}`"
        class="flex h-11 items-center gap-1.5 rounded-pill border border-line bg-surface px-4 text-sm hover:bg-surface-hover"
        @click="pointsPopover?.toggle($event)"
      >
        {{ pointsLabel }}
        <ChevronDown class="size-4" aria-hidden="true" />
      </button>
      <Popover
        ref="pointsPopover"
        :pt="{ root: { 'aria-label': $t('problems.pointsFilter') } }"
        @show="pointsOpen = true"
        @hide="pointsOpen = false"
      >
        <div class="flex gap-3">
          <label class="flex flex-col gap-1 text-sm">
            {{ $t('problems.pointsMin') }}
            <input
              name="pointsMin"
              autofocus
              type="number"
              inputmode="numeric"
              :value="filters.pointsMin ?? ''"
              class="h-11 w-28 rounded-row border border-line bg-surface-strong px-3 text-content"
              @change="setPoints('pointsMin', $event)"
            />
          </label>
          <label class="flex flex-col gap-1 text-sm">
            {{ $t('problems.pointsMax') }}
            <input
              name="pointsMax"
              type="number"
              inputmode="numeric"
              :value="filters.pointsMax ?? ''"
              class="h-11 w-28 rounded-row border border-line bg-surface-strong px-3 text-content"
              @change="setPoints('pointsMax', $event)"
            />
          </label>
        </div>
      </Popover>
    </div>
  </div>
</template>
