<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { PublishedProblem } from '@/api/types/contest-ops';
import AdminDataTable from '../../ui/table/AdminDataTable.vue';
import type { AdminColumn } from '../../ui/table/table-columns';
import { editorialKey, outcomeKey, reasonKey } from './publish-outcomes';

defineProps<{ items: readonly PublishedProblem[] }>();
const { t } = useI18n();
const columns = computed<AdminColumn[]>(() => [
  {
    key: 'problem',
    label: t('admin.contestPublish.columns.problem'),
    priority: 'primary',
    cellClass: 'font-mono whitespace-nowrap',
  },
  { key: 'outcome', label: t('admin.contestPublish.columns.outcome'), grow: true },
  { key: 'editorial', label: t('admin.contestPublish.columns.editorial'), priority: 'meta' },
]);
</script>

<template>
  <AdminDataTable
    :columns="columns"
    :rows="items"
    :row-key="(item) => item.problemId"
    :row-attrs="() => ({ 'data-testid': 'publish-row' })"
    :label="$t('admin.contestPublish.tableCaption')"
  >
    <template #cell-problem="{ row }">
      {{ row.code ?? $t('admin.contestPublish.privateProblem') }}
    </template>
    <template #cell-outcome="{ row }">
      {{ $t(outcomeKey(row)) }}
      <span v-if="reasonKey(row)" class="block text-muted">{{ $t(reasonKey(row)!) }}</span>
    </template>
    <template #cell-editorial="{ row }">
      {{ editorialKey(row) ? $t(editorialKey(row)!) : '—' }}
    </template>
  </AdminDataTable>
</template>
