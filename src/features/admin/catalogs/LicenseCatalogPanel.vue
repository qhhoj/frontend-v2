<script setup lang="ts">
import { Pencil } from 'lucide-vue-next';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import type { LicenseAdmin } from '@/api/types/problem-catalogs';
import AdminDrawer from '../ui/AdminDrawer.vue';
import { buttonClass } from '../ui/controls';
import AdminDataTable from '../ui/table/AdminDataTable.vue';
import type { AdminColumn } from '../ui/table/table-columns';
import { useLicensesAdminQuery } from './catalogs.queries';
import LicenseEditor from './LicenseEditor.vue';

/** Licenses: the rows, each with "Sửa"; create (`creating`, from the page header) and edit open the drawer. Never deleted. */
const creating = defineModel<boolean>('creating', { required: true });
const { t } = useI18n();
const { data, isPending, error, refetch } = useLicensesAdminQuery();
const editing = ref<LicenseAdmin | null>(null);
const isOpen = computed({
  get: () => creating.value || editing.value !== null,
  set: (open: boolean) => {
    if (open) return;
    creating.value = false;
    editing.value = null;
  },
});
const columns = computed<AdminColumn[]>(() => [
  { key: 'name', label: t('admin.catalogs.fields.name'), priority: 'primary' },
  { key: 'key', label: t('admin.catalogs.fields.key'), cellClass: 'font-mono' },
  {
    key: 'link',
    label: t('admin.catalogs.fields.link'),
    priority: 'meta',
    cellClass: 'max-w-80 truncate text-muted',
  },
]);
</script>

<template>
  <AdminDataTable
    :columns="columns"
    :rows="data ?? []"
    :row-key="(row) => row.id"
    :row-label="(row) => row.name"
    :label="$t('admin.catalogs.licenses.caption')"
    :loading="isPending"
    :error="error"
    :skeleton-rows="5"
    :empty-text="$t('admin.catalogs.empty')"
    @retry="refetch()"
  >
    <template #cell-name="{ row }">
      <span class="font-semibold">{{ row.name }}</span>
    </template>
    <template #actions="{ row }">
      <button
        type="button"
        :class="buttonClass('ghost', 'sm')"
        :aria-label="$t('admin.catalogs.editLabel', { name: row.name })"
        @click="editing = row"
      >
        <Pencil aria-hidden="true" class="size-4" :stroke-width="1.75" />
        {{ $t('admin.catalogs.edit') }}
      </button>
    </template>
  </AdminDataTable>
  <AdminDrawer
    v-model:visible="isOpen"
    :title="
      editing
        ? $t('admin.catalogs.editTitle', { name: editing.name })
        : $t('admin.catalogs.licenses.createTitle')
    "
    :width="720"
  >
    <LicenseEditor :row="editing" @done="isOpen = false" @cancel="isOpen = false" />
  </AdminDrawer>
</template>
