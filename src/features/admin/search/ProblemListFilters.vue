<script setup lang="ts">
import { problemTypeLabel } from '@/features/problems/problem-type-label';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type { RouteLocationRaw } from 'vue-router';
import { useRoute } from 'vue-router';
import type { ProblemEditingMeta } from '@/api/types/problem-editing';
import FormField from '@/components/ui/FormField.vue';
import SelectField from '@/components/ui/SelectField.vue';
import AdminField from '../ui/AdminField.vue';
import AdminFilterTabs from '../ui/AdminFilterTabs.vue';
import type { AdminFilterTab } from '../ui/AdminFilterTabs.vue';
import { INPUT } from '../ui/controls';
import AdminFilterBar from '../ui/table/AdminFilterBar.vue';
import type { ActiveFilter } from '../ui/table/AdminFilterBar.vue';
import { filterQueryOf, STAFF_STATUS_FILTERS, STATUS_TOGGLES } from './problem-list-filters';
import type { FilterPatch, ProblemListFilters } from './problem-list-filters';

/**
 * The problem list's filter row: search (with the exact-code "Mở" row), the three toggles (all, not finished, published),
 * and the "Bộ lọc" panel with the two review views (private, suggested), group, type and author. Every change lands in the
 * address; active panel filters show as removable chips.
 */
const props = defineProps<{
  filters: ProblemListFilters;
  meta: ProblemEditingMeta | undefined;
  authorError: string;
  resultText?: string;
  exact: { label: string; to: RouteLocationRaw } | null;
}>();
const emit = defineEmits<{ change: [patch: FilterPatch] }>();
const route = useRoute();
const { t } = useI18n();

const search = computed({
  get: () => props.filters.q,
  set: (text: string) => emit('change', { q: text.trim() }),
});
const statusTabs = computed<AdminFilterTab[]>(() =>
  STATUS_TOGGLES.map((status) => ({
    key: status,
    label: t(`admin.problemList.status.${status}`),
    to: { query: filterQueryOf(route.query, { status }) },
  })),
);

const authorText = ref(props.filters.author);
watch(
  () => props.filters.author,
  (author) => (authorText.value = author),
);
const commitAuthor = () => {
  const author = authorText.value.trim();
  if (author !== props.filters.author) emit('change', { author });
};
const selectValue = (event: Event) => (event.target as HTMLSelectElement).value;

const nameOf = (items: { id: string; fullName: string }[] | undefined, id: string) =>
  items?.find((item) => item.id === id)?.fullName ?? id;
const typeNameOf = (id: string) => {
  const type = props.meta?.types.find((item) => item.id === id);
  return type ? problemTypeLabel(type) : id;
};
const isStaffStatus = computed(() =>
  (STAFF_STATUS_FILTERS as readonly string[]).includes(props.filters.status),
);
const viewOptions = computed(() =>
  (['all', ...STAFF_STATUS_FILTERS] as const).map((status) => ({
    value: status,
    label: t(`admin.problemList.${status === 'all' ? 'anyStatus' : `status.${status}`}`),
  })),
);
const chips = computed<ActiveFilter[]>(() => {
  const { groupId, typeId, author, status } = props.filters;
  return [
    isStaffStatus.value && {
      key: 'status',
      label: t(`admin.problemList.status.${status}`),
    },
    groupId && {
      key: 'groupId',
      label: t('admin.problemList.chips.group', { name: nameOf(props.meta?.groups, groupId) }),
    },
    typeId && {
      key: 'typeId',
      label: t('admin.problemList.chips.type', { name: typeNameOf(typeId) }),
    },
    author && { key: 'author', label: t('admin.problemList.chips.author', { name: author }) },
  ].filter((chip): chip is ActiveFilter => Boolean(chip));
});
const remove = (key: string) => emit('change', { [key]: key === 'status' ? 'all' : '' });
const clearAll = () =>
  emit('change', {
    groupId: '',
    typeId: '',
    author: '',
    ...(isStaffStatus.value ? { status: 'all' as const } : {}),
  });
</script>

<template>
  <AdminFilterBar
    v-model:search="search"
    class="w-full"
    :search-label="$t('admin.problemList.searchLabel')"
    :result-text="resultText"
    :exact="exact"
    :chips="chips"
    :filter-count="chips.length"
    @remove="remove"
    @clear-all="clearAll"
  >
    <template #view>
      <AdminFilterTabs
        :tabs="statusTabs"
        :current="filters.status"
        :label="$t('admin.problemList.statusLabel')"
      />
    </template>
    <template #filters>
      <FormField :label="$t('admin.problemList.statusLabel')">
        <SelectField
          :model-value="isStaffStatus ? filters.status : 'all'"
          :options="viewOptions"
          @update:model-value="(status) => emit('change', { status })"
        />
      </FormField>
      <AdminField
        v-slot="{ id }"
        input-id="problem-filter-group"
        :label="$t('admin.problemList.group')"
      >
        <select
          :id="id"
          :class="INPUT"
          :value="filters.groupId"
          @change="emit('change', { groupId: selectValue($event) })"
        >
          <option value="">{{ $t('admin.problemList.anyGroup') }}</option>
          <option v-for="group in meta?.groups ?? []" :key="group.id" :value="group.id">
            {{ group.fullName }}
          </option>
        </select>
      </AdminField>
      <AdminField
        v-slot="{ id }"
        input-id="problem-filter-type"
        :label="$t('admin.problemList.type')"
      >
        <select
          :id="id"
          :class="INPUT"
          :value="filters.typeId"
          @change="emit('change', { typeId: selectValue($event) })"
        >
          <option value="">{{ $t('admin.problemList.anyType') }}</option>
          <option v-for="type in meta?.types ?? []" :key="type.id" :value="type.id">
            {{ problemTypeLabel(type) }}
          </option>
        </select>
      </AdminField>
      <AdminField
        v-slot="{ id, describedBy }"
        input-id="problem-filter-author"
        :label="$t('admin.problemList.author')"
        :error="authorError || undefined"
      >
        <input
          :id="id"
          v-model="authorText"
          type="text"
          autocomplete="off"
          spellcheck="false"
          :placeholder="$t('admin.problemList.authorPlaceholder')"
          :class="INPUT"
          :aria-describedby="describedBy"
          :aria-invalid="authorError ? 'true' : undefined"
          @keydown.enter.prevent="commitAuthor"
          @blur="commitAuthor"
        />
      </AdminField>
    </template>
  </AdminFilterBar>
</template>
