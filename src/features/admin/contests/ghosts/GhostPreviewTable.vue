<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { Ghost } from '@/api/types/contest-ghosts';
import AdminDataTable from '../../ui/table/AdminDataTable.vue';
import type { AdminColumn } from '../../ui/table/table-columns';
import { ghostStatusKey, PREVIEW_ROW_LIMIT } from './ghost-import';

/** A ghost set as rows: label, caption, filled cells, status (ranked or why not); cards on a phone. */
const props = defineProps<{ ghosts: Ghost[]; label: string }>();
const { t } = useI18n();
const shown = computed(() => props.ghosts.slice(0, PREVIEW_ROW_LIMIT));
const columns = computed<AdminColumn[]>(() => [
  { key: 'label', label: t('admin.ghosts.preview.columns.label'), priority: 'primary' },
  { key: 'caption', label: t('admin.ghosts.preview.columns.caption'), priority: 'secondary' },
  {
    key: 'cells',
    label: t('admin.ghosts.preview.columns.cells'),
    priority: 'secondary',
    align: 'end',
  },
  { key: 'status', label: t('admin.ghosts.preview.columns.status'), priority: 'secondary' },
]);
</script>

<template>
  <AdminDataTable
    :columns="columns"
    :rows="shown"
    :row-key="(ghost: Ghost) => ghost.label"
    :label="label"
    max-height="28rem"
  >
    <template #cell-label="{ row }"
      ><span class="font-semibold">{{ row.label }}</span></template
    >
    <template #cell-cells="{ row }">{{ row.cells.length }}</template>
    <template #cell-status="{ row }">
      <span :class="row.isUnranked && 'text-muted'">{{ $t(ghostStatusKey(row)) }}</span>
    </template>
    <template v-if="ghosts.length > shown.length" #footer>
      <span>{{
        $t('admin.ghosts.preview.more', { shown: shown.length, count: ghosts.length })
      }}</span>
    </template>
  </AdminDataTable>
</template>
