<script setup lang="ts">
import { Pencil } from 'lucide-vue-next';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import type { TaxonAdmin, TaxonKind } from '@/api/types/problem-catalogs';
import AdminDrawer from '../ui/AdminDrawer.vue';
import { buttonClass } from '../ui/controls';
import AdminDataTable from '../ui/table/AdminDataTable.vue';
import type { AdminColumn } from '../ui/table/table-columns';
import { useTaxaQuery } from './catalogs.queries';
import TaxonEditor from './TaxonEditor.vue';

/**
 * One name-only catalog: the rows, each with "Sửa"; create (`creating`, from the page header) and edit open the drawer.
 * Rows are never deleted (problems reference them). Keyed by `kind`.
 */
const props = defineProps<{ kind: TaxonKind }>();
const creating = defineModel<boolean>('creating', { required: true });
const { t } = useI18n();
const { data, isPending, error, refetch } = useTaxaQuery(props.kind);
const editing = ref<TaxonAdmin | null>(null);
const isOpen = computed({
  get: () => creating.value || editing.value !== null,
  set: (open: boolean) => {
    if (open) return;
    creating.value = false;
    editing.value = null;
  },
});
const columns = computed<AdminColumn[]>(() => [
  { key: 'fullName', label: t('admin.catalogs.fields.fullName'), priority: 'primary' },
  { key: 'name', label: t('admin.catalogs.fields.name'), mono: true },
]);
</script>

<template>
  <AdminDataTable
    :columns="columns"
    :rows="data ?? []"
    :row-key="(row) => row.id"
    :row-label="(row) => row.fullName"
    :label="$t(`admin.catalogs.${kind}.caption`)"
    :loading="isPending"
    :error="error"
    :skeleton-rows="5"
    :empty-text="$t('admin.catalogs.empty')"
    @retry="refetch()"
  >
    <template #cell-fullName="{ row }">
      <span class="font-semibold">{{ row.fullName }}</span>
    </template>
    <template #actions="{ row }">
      <button
        type="button"
        :class="buttonClass('ghost', 'sm')"
        :aria-label="$t('admin.catalogs.editLabel', { name: row.fullName })"
        @click="editing = row"
      >
        <Pencil aria-hidden="true" class="size-4" :stroke-width="1.75" />
        {{ $t('common.edit') }}
      </button>
    </template>
  </AdminDataTable>
  <AdminDrawer
    v-model:visible="isOpen"
    :title="
      editing
        ? $t('admin.catalogs.editTitle', { name: editing.fullName })
        : $t(`admin.catalogs.${kind}.createTitle`)
    "
    :width="480"
  >
    <TaxonEditor :kind="kind" :row="editing" @done="isOpen = false" @cancel="isOpen = false" />
  </AdminDrawer>
</template>
