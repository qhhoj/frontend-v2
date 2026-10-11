<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import type { ProblemEditingMeta } from '@/api/types/problem-editing';
import { ADMIN_INPUT_CLASS } from '../ui/classes';
import {
  ADMIN_PROBLEM_SORTS,
  filterQueryOf,
  PROBLEM_STATUS_FILTERS,
  sortLabelKey,
} from './problem-list-filters';
import type { FilterPatch, ProblemListFilters, ProblemStatusFilter } from './problem-list-filters';

/** Status tabs, group, type, author and sort of the staff problem list; every change lands in the address. */
const props = defineProps<{
  filters: ProblemListFilters;
  meta: ProblemEditingMeta | undefined;
  authorError: string;
}>();
const emit = defineEmits<{ change: [patch: FilterPatch] }>();
const route = useRoute();
const authorText = ref(props.filters.author);
watch(
  () => props.filters.author,
  (author) => (authorText.value = author),
);

const statusLink = (status: ProblemStatusFilter) => ({
  query: filterQueryOf(route.query, { status }),
});
const commitAuthor = () => {
  const author = authorText.value.trim();
  if (author !== props.filters.author) emit('change', { author });
};
const selectValue = (event: Event) => (event.target as HTMLSelectElement).value;
</script>

<template>
  <div class="flex flex-col gap-3">
    <nav
      :aria-label="$t('admin.problemList.statusLabel')"
      class="flex max-w-full gap-1 self-start overflow-x-auto rounded-pill border border-line-strong bg-surface-solid p-1"
    >
      <RouterLink
        v-for="status in PROBLEM_STATUS_FILTERS"
        :key="status"
        :to="statusLink(status)"
        :aria-current="filters.status === status ? 'true' : undefined"
        class="inline-flex min-h-11 shrink-0 items-center rounded-pill px-4 text-sm font-semibold text-muted hover:text-content aria-[current=true]:bg-accent-soft aria-[current=true]:text-accent-soft-text"
        >{{ $t(`admin.problemList.status.${status}`) }}</RouterLink
      >
    </nav>
    <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <label class="flex flex-col gap-1.5 text-sm font-semibold">
        {{ $t('admin.problemList.group') }}
        <select
          :class="ADMIN_INPUT_CLASS"
          :value="filters.groupId"
          @change="emit('change', { groupId: selectValue($event) })"
        >
          <option value="">{{ $t('admin.problemList.anyGroup') }}</option>
          <option v-for="group in meta?.groups ?? []" :key="group.id" :value="group.id">
            {{ group.fullName }}
          </option>
        </select>
      </label>
      <label class="flex flex-col gap-1.5 text-sm font-semibold">
        {{ $t('admin.problemList.type') }}
        <select
          :class="ADMIN_INPUT_CLASS"
          :value="filters.typeId"
          @change="emit('change', { typeId: selectValue($event) })"
        >
          <option value="">{{ $t('admin.problemList.anyType') }}</option>
          <option v-for="type in meta?.types ?? []" :key="type.id" :value="type.id">
            {{ type.fullName }}
          </option>
        </select>
      </label>
      <label class="flex flex-col gap-1.5 text-sm font-semibold">
        {{ $t('admin.problemList.author') }}
        <input
          v-model="authorText"
          type="text"
          autocomplete="off"
          spellcheck="false"
          :placeholder="$t('admin.problemList.authorPlaceholder')"
          :class="ADMIN_INPUT_CLASS"
          :aria-invalid="authorError ? 'true' : undefined"
          @keydown.enter.prevent="commitAuthor"
          @blur="commitAuthor"
        />
        <span v-if="authorError" class="text-xs font-normal text-negative">{{ authorError }}</span>
      </label>
      <label class="flex flex-col gap-1.5 text-sm font-semibold">
        {{ $t('admin.problemList.sort') }}
        <select
          :class="ADMIN_INPUT_CLASS"
          :value="filters.sort"
          @change="emit('change', { sort: selectValue($event) as ProblemListFilters['sort'] })"
        >
          <option v-for="sort in ADMIN_PROBLEM_SORTS" :key="sort" :value="sort">
            {{ $t(`admin.problemList.sorts.${sortLabelKey(sort)}`) }}
          </option>
        </select>
      </label>
    </div>
  </div>
</template>
